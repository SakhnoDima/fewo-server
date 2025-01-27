export const delayer = (time) =>
  new Promise((resolve) => setTimeout(resolve, time));
