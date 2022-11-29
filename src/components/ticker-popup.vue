<template>
  <div role="dialog" v-if="isOpen" class="fixed top-0 left-0 overflow-hidden">
    <div
      class="filed top-0 left-0 bg-black h-screen w-screen opacity-50"
      tabindex="0"
      role="button"
      @click="close"
      @keydown="backdropHandler"
    ></div>
    <div
      class="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white max-w-max rounded-md p-7 flex flex-col z-10 cursor-auto"
    >
      <slot name="header"></slot>
      <hr />
      <slot name="body"></slot>
      <hr />
      <div class="flex items-center justify-between flex-wrap gap-3">
        <slot name="actions" :close="close" :confirm="confirm"></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },
  emits: {
    ok: null,
    close: null,
  },

  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    handleKeydown(e) {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    },
    backdropHandler(e) {
      if (e.key === ' ' || e.code === 'Space') {
        this.close();
      }
    },

    close() {
      this.$emit('close');
    },
    confirm() {
      this.$emit('ok');
    },
  },
  watch: {
    isOpen(v) {
      if (v) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    },
  },
};
</script>
