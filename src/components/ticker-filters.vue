<template>
  <div class="mt-2">
    <button
      v-if="hasPrevPage"
      @click="$emit('prev-page')"
      class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
    >
      Назад
    </button>
    <button
      v-if="hasNextPage"
      @click="$emit('next-page')"
      class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
    >
      Вперед
    </button>
    <div>
      Фильтр:
      <input
        :value="filter"
        @input="$emit('filter-change', $event.target.value)"
      />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    currentPage: {
      type: Number,
      required: true,
    },
    hasNextPage: {
      type: Boolean,
      required: true,
    },
    hasPrevPage: {
      type: Boolean,
      required: true,
    },
    filter: {
      type: String,
      required: true,
    },
  },

  emits: {
    'prev-page': null,
    'next-page': null,
    'filter-change': (value) => typeof value === 'string',
  },
};
</script>
