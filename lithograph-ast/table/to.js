const { string, number, data, union } = require("@algebraic/type");
const { Map } = require("@algebraic/collections");
const toProduct = require("./to-product");
const toType = require("./to-type");


module.exports = function to(type, { table, headers = false } = { })
{
    return toType(type, toProduct({ table, headers }));
}







/*function toPrimitive(type, entries)
{
    if (entries.size !== 1)
        return fail(type,
            `${type} expected single table entry, but got ${entries.size}.`);

    if 
}*/

/*
const document2 = require("remark").parse(`
  | key | value |
  | - | - |
  | **https://tonic.work/tonic-test** | \`Unsupported\` |
  | **https://tonic.work/api/tonic-test** | \`Unsupported\` |
  | **https://tonic.work/tonic-test** |\`Success\` |
  | └ \`type\`  |\`rich\`                 |
  | └ \`width\` | \`450\`               |
  | └ \`on ready\` | \`onEmbedReady\`   |`);

const document = require("remark").parse(`
  | key | value |
  | - | - |
  | **https://tonic.work/tonic-test** | \`Unsupported\` |
  | **https://tonic.work/api/tonic-test** | \`Unsupported\` |
  | **https://tonic.work/tonic-test-2** |\`Success\` |
  | └ \`type\`  |\`rich\`                 |
  | └ \`width\` | \`450\`               |`);

const table = document.children[0];
const Result = union `Result` (
    data `Unsupported` (),
    data `Success` (
        type    => string,
        width   => number));

console.log(module.exports(Map(string, Result), { table }));*/








