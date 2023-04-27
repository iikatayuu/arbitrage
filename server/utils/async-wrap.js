
const asyncWrap = fn => (req, res, next) => {
  const promise = fn(req, res, next)
  return Promise.resolve(promise).catch(next)
}

module.exports = asyncWrap
