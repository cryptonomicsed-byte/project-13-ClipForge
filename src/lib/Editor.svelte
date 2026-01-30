<script>
  import { createEventDispatcher } from 'svelte';
  import { appStore } from './store.js';
  import ClipCard from './components/ClipCard.svelte';
  import VideoPlayer from './components/VideoPlayer.svelte';

  const dispatch = createEventDispatcher();
  
  export let videoData;

  let clips = [];
  let selectedClip = null;
  let selectedClips = [];
  let editMode = false;

  $: if ($appStore.detectedClips) {
    clips = $appStore.detectedClips.map((clip, i) => ({
      ...clip,
      id: clip.id || `clip-${i}`,
      selected: false,
      editing: false
    }));
  }

  function toggleClipSelection(id) {
    clips = clips.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    );
    updateSelectedClips();
  }

  function updateSelectedClips() {
    selectedClips = clips.filter(c => c.selected);
  }

  function selectClip(id) {
    selectedClip = clips.find(c => c.id === id);
  }

  function deleteClip(id) {
    clips = clips.filter(c => c.id !== id);
    if (selectedClip?.id === id) selectedClip = null;
    updateSelectedClips();
  }

  function updateClip(id, updates) {
    clips = clips.map(c => c.id === id ? { ...c, ...updates } : c);
  }

  function selectAll() {
    clips = clips.map(c => ({ ...c, selected: true }));
    updateSelectedClips();
  }

  function clearSelection() {
    clips = clips.map(c => ({ ...c, selected: false }));
    updateSelectedClips();
  }

  function duplicateClip(id) {
    const clip = clips.find(c => c.id === id);
    if (clip) {
      const newClip = { ...clip, id: `clip-${Date.now()}` };
      clips = [...clips, newClip];
    }
  }

  function handleExport() {
    if (selectedClips.length === 0) {
      alert('Please select at least one clip to export');
      return;
    }

    appStore.setClips(selectedClips);
    dispatch('complete');
  }
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold">Edit Clips</h2>
      <p class="text-gray-400">Select and customize clips for export</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-gray-400">Found {clips.length} clips</p>
    </div>
  </div>

  <!-- Toolbar -->
  <div class="flex items-center justify-between bg-gray-900 rounded-lg p-4">
    <div class="flex items-center gap-2">
      <button
        on:click={selectAll}
        class="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition"
      >
        Select All
      </button>
      <button
        on:click={clearSelection}
        class="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition"
      >
        Clear
      </button>
    </div>
    <div class="text-sm text-gray-400">
      {selectedClips.length} of {clips.length} selected
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Clips List -->
    <div class="lg:col-span-2">
      <div class="space-y-4 max-h-[600px] overflow-y-auto">
        {#each clips as clip (clip.id)}
          <div
            on:click={() => selectClip(clip.id)}
            class={`cursor-pointer transition rounded-lg border-2 ${
              selectedClip?.id === clip.id
                ? 'border-red-500 bg-gray-900'
                : 'border-gray-700 bg-gray-950 hover:border-gray-600'
            }`}
          >
            <ClipCard
              {clip}
              selected={selectedClips.some(c => c.id === clip.id)}
              on:toggle={() => toggleClipSelection(clip.id)}
              on:delete={() => deleteClip(clip.id)}
              on:duplicate={() => duplicateClip(clip.id)}
              on:update={(e) => updateClip(clip.id, e.detail)}
            />
          </div>
        {/each}
      </div>
    </div>

    <!-- Preview -->
    <div class="space-y-4">
      {#if selectedClip}
        <div class="bg-gray-900 rounded-lg overflow-hidden sticky top-20">
          <VideoPlayer clip={selectedClip} videoPath={videoData.filepath} />
          
          <div class="p-4 space-y-4">
            <div>
              <h4 class="font-bold mb-2">Clip Details</h4>
              <div class="text-sm text-gray-400 space-y-1">
                <p>Start: {selectedClip.start?.toFixed(1)}s</p>
                <p>End: {selectedClip.end?.toFixed(1)}s</p>
                <p>Duration: {(selectedClip.end - selectedClip.start)?.toFixed(1)}s</p>
                <p>Score: {selectedClip.score?.toFixed(2) || 'N/A'}</p>
                <p>Reason: {selectedClip.reason || 'Auto-detected'}</p>
              </div>
            </div>

            <!-- Edit Controls -->
            <div class="space-y-3">
              <button
                on:click={() => duplicateClip(selectedClip.id)}
                class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
              >
                Duplicate
              </button>
              <button
                on:click={() => deleteClip(selectedClip.id)}
                class="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      {:else}
        <div class="bg-gray-900 rounded-lg p-8 text-center text-gray-400">
          <p>👆 Select a clip to preview</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="flex gap-4 pt-8 border-t border-gray-800">
    <button
      on:click={() => dispatch('back')}
      class="px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-lg font-medium transition"
    >
      Back
    </button>
    <button
      on:click={handleExport}
      disabled={selectedClips.length === 0}
      class="ml-auto px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white rounded-lg font-medium transition"
    >
      Continue to Export ({selectedClips.length} clips)
    </button>
  </div>
</div>
