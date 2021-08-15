const convert = (from, to, str) => Buffer.from(str, from).toString(to)
exports.utf8ToHex = (str) => convert('utf8', 'hex', str)
exports.hexToUtf8 = (str) => convert('hex', 'utf8', str)