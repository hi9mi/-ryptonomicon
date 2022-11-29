<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <pre-loader v-if="!availableTickers.length" />
    <div class="container">
      <create-ticker-form
        :suggestions="suggestions"
        :error="error"
        @create-ticker="createTicker"
        @change-ticker="handleChangeTicker"
      />
      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <div>
          <button
            v-if="page > 1"
            @click="page = page - 1"
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Назад
          </button>
          <button
            v-if="hasNextPage"
            @click="page = page + 1"
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Вперед
          </button>
          <div>Фильтр: <input v-model="filter" /></div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="t in paginatedTickers"
            :key="t.name"
            @click="selectTicker(t)"
            :class="{
              'border-4': selectedTicker === t,
              'bg-red-100': !t.valid,
              'bg-white': t.valid,
            }"
            class="overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(t.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="deleteTicker(t)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
      <ticker-price-graph
        v-if="selectedTicker"
        :tickerName="selectedTicker.name"
        :graph="graph"
        @close-graph="selectedTicker = null"
        @max-graph-elements="maxGraphElements = $event"
      />
    </div>
  </div>
</template>

<script>
import CreateTickerForm from './components/create-ticker-form.vue';
import TickerPriceGraph from './components/ticker-price-graph.vue';
import PreLoader from './components/pre-loader.vue';
import {
  subscribeToTicker,
  unsubscribeFromTicker,
  getTickersList,
} from './api';

export default {
  name: 'App',
  components: {
    CreateTickerForm,
    TickerPriceGraph,
    PreLoader,
  },
  data() {
    return {
      tickers: [],
      selectedTicker: null,
      graph: [],
      availableTickers: [],
      error: false,
      suggestions: [],
      page: 1,
      filter: '',
      maxGraphElements: 3,
    };
  },
  async created() {
    this.availableTickers = await getTickersList();

    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );

    const VALID_KEYS = ['filter', 'page'];

    VALID_KEYS.forEach((key) => {
      if (windowData[key]) {
        this[key] = windowData[key];
      }
    });

    const tickersData = localStorage.getItem('cryptonomicon-list');

    if (tickersData) {
      this.tickers = JSON.parse(tickersData);
      this.tickers.forEach((ticker) => {
        subscribeToTicker(ticker.name, (newPrice, invalid) => {
          this.updateTicker(ticker.name, newPrice, invalid);
        });
      });
    }
  },

  computed: {
    startIndex() {
      return (this.page - 1) * 6;
    },

    endIndex() {
      return this.page * 6;
    },

    filteredTickers() {
      return this.tickers.filter((ticker) => ticker.name.includes(this.filter));
    },

    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page,
      };
    },
  },

  methods: {
    updateTicker(tickerName, price, invalid) {
      const ticker = this.tickers.find((t) => t.name === tickerName);
      if (invalid) {
        ticker.valid = false;
        return;
      }

      if (ticker === this.selectedTicker) {
        this.graph.push(price);

        while (this.graph.length > this.maxGraphElements) {
          this.graph.shift();
        }
      }
      ticker.price = price;
    },
    handleChangeTicker(event) {
      const ticker = event.target.value;
      this.error = false;
      this.suggestions = this.availableTickers
        .filter((availableTicker) =>
          availableTicker.toLowerCase().includes(ticker.toLowerCase())
        )
        .slice(0, 4);
    },

    formatPrice(price) {
      price = price ?? '-';
      if (price === '-') return price;
      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },

    createTicker(ticker) {
      const currentTicker = {
        name: ticker,
        price: '-',
        valid: true,
      };
      const isAddedTicker = this.tickers.find(
        (addedTicker) => addedTicker.name === currentTicker.name
      );

      if (isAddedTicker) {
        this.error = true;
        return;
      }

      this.tickers = [...this.tickers, currentTicker];

      this.suggestions = [];
      this.filter = '';

      subscribeToTicker(currentTicker.name, (newPrice, invalid) => {
        this.updateTicker(currentTicker.name, newPrice, invalid);
      });
    },
    deleteTicker(tickerToDelete) {
      this.tickers = this.tickers.filter((t) => t !== tickerToDelete);
      if (this.selectedTicker === tickerToDelete) {
        this.selectedTicker = null;
      }
      unsubscribeFromTicker(tickerToDelete.name);
    },

    selectTicker(ticker) {
      if (!ticker.valid) {
        return;
      }
      this.selectedTicker = ticker;
    },
  },
  watch: {
    selectedTicker() {
      this.graph = [];
    },
    tickers() {
      localStorage.setItem('cryptonomicon-list', JSON.stringify(this.tickers));
    },
    filter() {
      this.page = 1;
    },
    pageStateOptions(v) {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${v.filter}&page=${v.page}`
      );
    },
    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },
  },
};
</script>
