module.exports = {
  transformers: {
    toUpper: (value) => value.toUpperCase(),
    test: (value, ctx) => JSON.stringify(ctx),
  },
  functions: {
    date: (ctx) => {
      return `date:${new Date().getDate()}`;
    },
  },
  keysToQuestions: {
    key5: "enter a value for key5",
  },
};