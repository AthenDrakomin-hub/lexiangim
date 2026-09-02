<template>
  <div class="jg-skeleton-message" v-for="n in 5" :key="n">
    <div class="jg-skeleton jg-skeleton-avatar"></div>
    <div class="jg-skeleton jg-skeleton-content">
      <div class="jg-skeleton jg-skeleton-line short"></div>
      <div class="jg-skeleton jg-skeleton-line long"></div>
    </div>
  </div>
</template>

<style scoped>
.jg-skeleton-message {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
}

.jg-skeleton {
  background: linear-gradient(90deg, var(--jg-bg-card) 25%, var(--jg-bg-hover) 50%, var(--jg-bg-card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.jg-skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.jg-skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.jg-skeleton-line {
  height: 16px;
  border-radius: 4px;
}

.jg-skeleton-line.short { width: 60%; }
.jg-skeleton-line.long { width: 80%; }
</style>
