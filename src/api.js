// todo: remove constants and use URL and URLSearchParams
const API_KEY =
  '36a80c87ff12cd1db75487c55ae74d75e96cf0a715b6133e8252439cb1155266';
const tickersHandlers = new Map();
let tickersList = [];
// const params = new URLSearchParams({
//   api_key: API_KEY
// })

const bc = new BroadcastChannel('general');
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);
const AGGREGATE_INDEX = '5';
const INVALID_SUB = '500';
const TOO_MANY_SOCKETS_PER_CLIENT = '429';

const updateTicker = (tickerName, newPrice, invalid) => {
  const handlers = tickersHandlers.get(tickerName) ?? [];
  handlers.forEach((fn) => fn(newPrice, invalid));
};

socket.addEventListener('message', (e) => {
  const {
    TYPE: type,
    FROMSYMBOL,
    TOSYMBOL: toCurrency,
    PRICE: newPrice,
    PARAMETER: param,
  } = JSON.parse(e.data);
  const fromCurrency = FROMSYMBOL ?? param?.split('~').reverse()[1];

  let ratioBTC = 1;
  let priceBTC;
  if (fromCurrency === 'BTC') {
    priceBTC = newPrice;
  } else if (toCurrency === 'BTC') {
    ratioBTC = priceBTC;
  }

  if (type === TOO_MANY_SOCKETS_PER_CLIENT) {
    console.log(fromCurrency);
    bc.addEventListener('message', (e) => {
      const { ticker, newPrice, invalid } = JSON.parse(e.data);
      updateTicker(ticker, newPrice * ratioBTC, invalid);
    });
    return;
  }

  if (type === AGGREGATE_INDEX && newPrice !== undefined) {
    updateTicker(fromCurrency, newPrice * ratioBTC);
    bc.postMessage(JSON.stringify({ ticker: fromCurrency, newPrice }));
    return;
  }

  const isValidTicker = tickersList.includes(fromCurrency);

  if (!isValidTicker && type === INVALID_SUB) {
    updateTicker(fromCurrency, '-', true);
    bc.postMessage(
      JSON.stringify({ ticker: fromCurrency, newPrice: '-', invalid: true })
    );
    return;
  }

  if (type === INVALID_SUB) {
    createCrossSubscription(param);
  }
});

const createCrossSubscription = (param) => {
  const [toCurrency, fromCurrency] = param.split('~').reverse();
  const isValidTicker = tickersList.includes(fromCurrency);

  if (!isValidTicker || fromCurrency === 'BTC' || toCurrency === 'BTC') {
    return;
  }
  subscriberToTickerOnWs('BTC', 'USD');
  subscriberToTickerOnWs(fromCurrency, 'BTC');
};

const sendToWebsocket = (message) => {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
  }

  socket.addEventListener(
    'open',
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
};

const subscriberToTickerOnWs = (ticker, convertCurrency) => {
  const message = {
    action: 'SubAdd',
    subs: [`5~CCCAGG~${ticker}~${convertCurrency}`],
  };
  sendToWebsocket(message);
};

const unsubscribeFromTickerOnWs = (ticker, convertCurrency) => {
  sendToWebsocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${ticker}~${convertCurrency}`],
  });
};

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);

  subscriberToTickerOnWs(ticker, 'USD');
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeFromTickerOnWs(ticker, 'USD');
};

export const getTickersList = async () => {
  const res = await fetch(
    'https://min-api.cryptocompare.com/data/all/coinlist?summary=true'
  );
  const availableTickers = await res.json();

  tickersList = Object.values(availableTickers.Data).map(
    ({ Symbol }) => Symbol
  );

  return tickersList;
};
