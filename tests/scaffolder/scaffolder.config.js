module.exports = {
  transformers: {
    toUpper: (value) => value.toUpperCase(),
    test: (value, ctx) => `${value}|${JSON.stringify(ctx)}`,
  },
};
