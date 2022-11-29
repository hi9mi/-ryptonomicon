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
        <ticker-filters
          @prev-page="page -= 1"
          @next-page="page += 1"
          :hasNextPage="hasNextPage"
          :hasPrevPage="page > 1"
          :currentPage="Number(page)"
          @filter-change="filter = $event"
          :filter="filter"
        />
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <ticker-card
            v-for="t in paginatedTickers"
            :key="t.name"
            :ticker="t"
            :selected="t === selectedTicker"
            @select-ticker="selectTicker($event)"
            @delete-ticker="deleteTicker($event)"
          />
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
import TickerFilters from './components/ticker-filters.vue';
import TickerCard from './components/ticker-card.vue';
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
    TickerFilters,
    TickerCard,
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
      if (!ticker.valid || !Number(ticker.price)) {
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
