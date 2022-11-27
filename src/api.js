const API_KEY =
  '36a80c87ff12cd1db75487c55ae74d75e96cf0a715b6133e8252439cb1155266';

const tickersHandlers = new Map();

export const loadTickers = async () => {
  if (tickersHandlers.size === 0) {
    return;
  }

  const f = await fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
      ...tickersHandlers.keys(),
    ].join(',')}&tsyms=USD&api_key=${API_KEY}`
  );
  const data = await f.json();
  const updatedPrices = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value.USD])
  );
  Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
    const handlers = tickersHandlers.get(currency) ?? [];
    handlers.forEach((fn) => fn(newPrice));
  });
};

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
};

setInterval(loadTickers, 5000);

export const unsubscribeFromTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [subscribers.filter((fn) => fn !== cb)]);
};
