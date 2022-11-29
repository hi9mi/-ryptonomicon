<template>
  <div
    @click="$emit('select-ticker', ticker)"
    :class="{
      'border-4': selected,
      'bg-red-100': !ticker.valid || !Number(ticker.price),
      'bg-white': ticker.valid && Number(ticker.price),
    }"
    class="overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
  >
    <div class="px-4 py-5 sm:p-6 text-center">
      <dt class="text-sm font-medium text-gray-500 truncate">
        {{ ticker.name }} - USD
      </dt>
      <dd class="mt-1 text-3xl font-semibold text-gray-900">
        {{ formatPrice(ticker.price) }}
      </dd>
    </div>
    <div class="w-full border-t border-gray-200"></div>
    <button
      @click.stop="(isOpenPopup = true), (confirmation = '')"
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
    <ticker-popup
      @ok="confirmPopup"
      @close="isOpenPopup = false"
      :isOpen="isOpenPopup"
    >
      <template #header>
        <h2 class="mb-7">Внимание!</h2>
      </template>
      <template #body>
        <p class="mb-7">
          Для того чтобы удалять тикер нужно ввести его имя -
          <strong>{{ ticker.name }}</strong>
        </p>
      </template>
      <template #actions="{ confirm, close }">
        <input type="text" v-model="confirmation" :placeholder="ticker.name" />
        <div>
          <button
            @click="close"
            class="inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Отменить
          </button>
          <button
            @click="confirm"
            :disabled="!isConfirmationCorrect"
            class="inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-300"
          >
            Подтвердить
          </button>
        </div>
      </template>
    </ticker-popup>
  </div>
</template>

<script>
import TickerPopup from './ticker-popup.vue';

export default {
  components: {
    TickerPopup,
  },

  props: {
    ticker: {
      type: Object,
      required: true,
    },
    selected: {
      type: Boolean,
      required: true,
    },
  },

  emits: {
    'delete-ticker': (ticker) => typeof ticker === 'object',
    'select-ticker': (ticker) => typeof ticker === 'object',
  },

  data() {
    return {
      confirmation: '',
      isOpenPopup: false,
    };
  },

  computed: {
    isConfirmationCorrect() {
      return this.confirmation === this.ticker.name;
    },
  },

  methods: {
    formatPrice(price) {
      price = price ?? '-';
      if (price === '-') return price;
      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },

    confirmPopup() {
      this.closePopup = false;
      this.$emit('delete-ticker', this.ticker);
    },
  },
};
</script>
