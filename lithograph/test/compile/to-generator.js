const { List, Map } = require("immutable");
const { Suite, Test } = require("../suite");
const TestPath = require("../test-path");
const valueToExpression = require("./value-to-expression");
const { transformFromAst } = require("babel-core");

//console.log(JSON.stringify(suite, null, 2));

//return;

const t = require("babel-types");
const void0 = t.unaryExpression("void", t.numericLiteral(0));
const { parse } = require("@babel/parser");
const parseStatements = (...args) => parse(...args).program.body;
const { default: generate } = require("babel-generator");

const construct = require("babel-template");
const template = string =>
    ((template => options => template(options).expression)
    (construct(`(${string})`)))

const { Record } = require("immutable");
const SourceEntry = Record({ path:-1, fragment:-1 }, "SourceEntry");
const Module = require("module");
const { dirname } = require("path");


module.exports = function (root, environment, filename)
{
    const parameters = Object.keys(environment);
    const source = toModuleSource(root, parameters);
    const module = new Module(filename);

    module.filename = filename;
    module.paths = Module._nodeModulePaths(dirname(filename));

    const toGenerator = module._compile(source, filename);

    module.loaded = true;

    return toGenerator(...parameters.map(key => environment[key]));
}

function toModuleSource(root, parameters)
{
    const { fragment } = fromPath(root).get(0);
    const { code } = generate(fragment);

    return `return (${parameters}) => (${code})`;
}

function fromPath(path, wrap)
{
    const { node, id } = path.data;

    if (node instanceof Test)
        return fromTest(path, wrap || !path.next);

    if (node.metadata.schedule === "Serial")
        return fromSerial(path, wrap);

    return fromConcurrent(path, true);
}

const TEST_TEMPLATE = template(function * ()
{
    return (yield "test")($id, async () => { $statements })
});

function fromTest(path, wrap)
{
    const { data: { node, id } } = path;
    const allowAwaitOutsideFunction = true;
    const $statements = node.children
        .flatMap(({ code }) =>
            parseStatements(code, { allowAwaitOutsideFunction }))
        .toArray();
    const fragment = wrap ?
        TEST_TEMPLATE({ $id: t.stringLiteral(id), $statements }) :
        $statements;

    return List.of(SourceEntry({ path, fragment }));
}

const CONCURRENT_TEMPLATE = template(function * ()
{
    return (yield "concurrent")([$children]);
});

function fromConcurrent(path)
{
    const { node } = path.data;
    const children = node.children
        .flatMap((child, index) =>
            fromPath(TestPath.child(path, index, child), true))
        .toArray();

    if (children.length <= 0)
        return List();

    const $children = Array.from(
        children,
        ({ fragment }) => fragment);
    const fragment = CONCURRENT_TEMPLATE({ $children });

    return List.of(SourceEntry({ path, fragment }));
}

const SERIAL_TEMPLATE = template(function * ()
{
    return (yield "serial")(function * ()
    {
        yield $children;
        $statements;
    }());
});

function fromSerial(path, wrap)
{
    const { node } = path.data;
    const children = node.children
        .flatMap((child, index) =>
            fromPath(TestPath.child(path, index, child)));

    if (!wrap)
        return children;

    if (children.size <= 0)
        return List();

    const groups = children.groupBy(({ path }) =>
        path.data.node instanceof Test ? "test" : "suite");
    const tests = groups.get("test", List());

    const serial = tests
        .map(({ path }) => path.data.id)
        .toArray();
    const concurrent = groups.get("suite", List())
        .map(({ path, fragment }) => fragment)
        .toArray();

    const $statements = tests
        .flatMap(({ path: { data: { id } }, fragment }) =>
        [
            yield("start", id),
            ...transformStatements(fragment)
        ]).toArray();
    const $children = valueToExpression([concurrent, serial]);
    const fragment = SERIAL_TEMPLATE({ $statements, $children });

    return List.of(SourceEntry({ path, fragment }));
}

function yield(name, value)
{
    return t.yieldExpression(valueToExpression({ name, value }));
}


const transformStatements = (function ()
{
    const toVisitor = visitor => () => ({ visitor });
    const AwaitExpression = path =>
        path.replaceWith(yield("await", path.node.argument));
    const Function = path =>
        t.isProgram(path.getFunctionParent().node) && path.skip()
    const awaitToYield = toVisitor({ AwaitExpression, Function }) ;
    const options = { plugins: [awaitToYield] };

    return statements =>
        transformFromAst(t.program(statements), "", options)
            .ast.program.body;
})();


