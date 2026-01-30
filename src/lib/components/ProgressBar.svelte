<script>
  export let value = 0;
  export let max = 100;
  export let showLabel = true;

  $: percentage = (value / max) * 100;
</script>

<div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
  <div
    class="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all duration-300 ease-out"
    style="width: {percentage}%"
  ></div>
</div>

{#if showLabel}
  <p class="text-xs text-gray-400 mt-1">{Math.round(percentage)}%</p>
{/if}
