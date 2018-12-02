const { data, union, boolean, string, number, parameterized } = require("@algebraic/type");
const { Set } = require("@algebraic/collections");
const fromTable = require("@lithograph/plugin/from-table");
const { Failure, Variable } = require("@lithograph/remark/parse-type");
const Section = require("@lithograph/ast/section");
console.log(Variable);
const Format = union `Format` (
    data `JSON` (),
    data `XML` () );

const OEmbedConfiguration = data `OEmbedConfiguration` (
    providerName    => string,
    providerURL     => URL,
    formats         => Set(Format),
    maxwidths       => Set(number) );


module.exports = function OEmbedPlugin(section)
{
    const { preamble, subsections } = section;
    const table = preamble.get(0);
    const configuration = fromTable(OEmbedConfiguration, table);

    if (Failure.is(configuration))
        throw TypeError(configuration.message);

    const { formats, maxwidths } = configuration;
    const transformed = subsections.map(transformCase);

    console.log(configuration);

    return Section({ ...section, subsections: transformed });
}


const transformCase = (function ()
{
    const URLVariable = Variable(string);
    
    
    const URLTestCase = data `URLTestCase` (
        URL         => URLVariable);

    return function transformCase(section)
    {
        const { preamble } = section;
        const table = preamble.last();

        if (table.type !== "table")
            return section;

        const testCaseArguments = fromTable(URLTestCase, table);

        if (Failure.is(testCaseArguments))
            throw TypeError(testCaseArguments.message);

        const child = Section.fromMarkdown(`${__dirname}/test-cases/json-response-implemented.md`, testCaseArguments);
        const { subsections } = section;

        return Section({ ...section, subsections: subsections.push(child) });
    }
})();













