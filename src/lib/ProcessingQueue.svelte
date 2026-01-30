<script>
  import { createEventDispatcher } from 'svelte';
  import { appStore } from './store.js';

  const dispatch = createEventDispatcher();

  $: queue = $appStore.processingQueue;
  $: isProcessing = $appStore.processingActive;
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-3xl font-bold">Processing Queue</h2>
    <button
      on:click={() => dispatch('close')}
      class="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium transition"
    >
      Close
    </button>
  </div>

  {#if queue.length === 0}
    <div class="bg-gray-900 rounded-lg p-12 text-center text-gray-400">
      <p class="text-lg">Queue is empty</p>
      <p class="text-sm mt-2">Add videos to process them in batch</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each queue as item (item.id)}
        <div class="bg-gray-900 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="font-bold">{item.filename}</h4>
              <p class="text-sm text-gray-400">{item.size} • {item.status}</p>
            </div>
            <span class={`px-3 py-1 rounded text-sm font-medium ${
              item.status === 'processing' ? 'bg-blue-600' :
              item.status === 'complete' ? 'bg-green-600' :
              item.status === 'error' ? 'bg-red-600' :
              'bg-gray-700'
            }`}>
              {item.status}
            </span>
          </div>

          {#if item.progress !== undefined}
            <div class="mb-2">
              <div class="w-full bg-gray-800 rounded-full h-2">
                <div
                  class="bg-red-500 h-2 rounded-full transition-all"
                  style="width: {item.progress}%"
                ></div>
              </div>
              <p class="text-xs text-gray-400 mt-1">{item.progress}%</p>
            </div>
          {/if}

          {#if item.message}
            <p class="text-xs text-gray-400">{item.message}</p>
          {/if}
        </div>
      {/each}
    </div>

    <div class="bg-gray-900 rounded-lg p-4 space-y-3">
      <div class="text-sm">
        <p><strong>{queue.filter(i => i.status === 'complete').length}</strong> completed</p>
        <p><strong>{queue.filter(i => i.status === 'processing').length}</strong> processing</p>
        <p><strong>{queue.filter(i => i.status === 'pending').length}</strong> pending</p>
      </div>

      {#if isProcessing}
        <button
          disabled
          class="w-full px-4 py-2 bg-gray-700 text-gray-400 rounded-lg text-sm font-medium"
        >
          Processing...
        </button>
      {/if}
    </div>
  {/if}
</div>
