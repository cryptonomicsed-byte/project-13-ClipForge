<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  export let clip;
  export let selected = false;

  function handleCheckbox(e) {
    dispatch('toggle');
  }

  function handleDelete(e) {
    e.stopPropagation();
    dispatch('delete');
  }

  function handleDuplicate(e) {
    e.stopPropagation();
    dispatch('duplicate');
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  const reasonEmojis = {
    'HUMOR': '😂',
    'INSIGHT': '💡',
    'EMOTIONAL_PEAK': '🎭',
    'STORY_BEAT': '📖',
    'CONTROVERSY': '🔥',
    'PATTERN_BREAK': '⚡',
    'CALL_TO_ACTION': '📢',
    'TRENDING_TOPIC': '📈'
  };
</script>

<div class="p-4 space-y-3">
  <!-- Header -->
  <div class="flex items-start justify-between">
    <div class="flex items-center gap-3 flex-1">
      <input
        type="checkbox"
        checked={selected}
        on:change={handleCheckbox}
        class="w-5 h-5 cursor-pointer"
      />
      <div class="flex-1">
        <h4 class="font-bold text-sm">
          {formatTime(clip.start)} - {formatTime(clip.end)}
        </h4>
        <p class="text-xs text-gray-500">
          {(clip.end - clip.start).toFixed(1)}s duration
        </p>
      </div>
    </div>
    <div class="text-2xl">
      {reasonEmojis[clip.reason] || '✨'}
    </div>
  </div>

  <!-- Reason Badge -->
  <div class="flex items-center gap-2">
    <span class="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded">
      {clip.reason}
    </span>
    <span class="text-xs text-gray-400">
      Score: {clip.score?.toFixed(2) || 'N/A'}
    </span>
  </div>

  <!-- Hook/Description -->
  {#if clip.hook}
    <p class="text-sm text-gray-300 italic">
      "{clip.hook}"
    </p>
  {/if}

  <!-- Actions -->
  <div class="flex gap-2 pt-2">
    <button
      on:click={handleDuplicate}
      class="flex-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs rounded transition"
    >
      Duplicate
    </button>
    <button
      on:click={handleDelete}
      class="flex-1 px-3 py-1 bg-red-900 bg-opacity-30 hover:bg-opacity-50 text-xs text-red-300 rounded transition"
    >
      Delete
    </button>
  </div>
</div>
