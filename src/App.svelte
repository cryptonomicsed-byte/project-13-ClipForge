<script>
  import { onMount } from 'svelte';
  import Upload from './lib/Upload.svelte';
  import Processor from './lib/Processor.svelte';
  import Editor from './lib/Editor.svelte';
  import ExportPanel from './lib/ExportPanel.svelte';
  import ProcessingQueue from './lib/ProcessingQueue.svelte';
  import { appStore } from './lib/store.js';

  let currentStep = 'upload'; // upload | processing | editing | export | queue
  let videoData = null;

  onMount(() => {
    // Listen for store changes
    appStore.subscribe(state => {
      if (state.currentVideo) {
        videoData = state.currentVideo;
        if (state.processingComplete) {
          currentStep = 'editing';
        }
      }
    });
  });

  function handleUploadComplete(e) {
    videoData = e.detail;
    currentStep = 'processing';
  }

  function handleProcessingComplete() {
    currentStep = 'editing';
  }

  function handleEditingComplete() {
    currentStep = 'export';
  }

  function handleExportComplete() {
    currentStep = 'upload';
    videoData = null;
    appStore.reset();
  }

  function handleQueueOpen() {
    currentStep = 'queue';
  }

  function handleQueueClose() {
    currentStep = videoData ? 'editing' : 'upload';
  }
</script>

<main class="min-h-screen bg-black text-white">
  <!-- Header -->
  <header class="sticky top-0 z-50 bg-black border-b border-gray-800">
    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center font-bold">
          CF
        </div>
        <div>
          <h1 class="text-2xl font-bold">ClipForge</h1>
          <p class="text-xs text-gray-400">AI Video Clip Generator</p>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <button
          on:click={handleQueueOpen}
          class="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium transition"
        >
          Processing Queue
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-4 py-8">
    {#if currentStep === 'upload'}
      <Upload on:complete={handleUploadComplete} />
    {:else if currentStep === 'processing'}
      <Processor {videoData} on:complete={handleProcessingComplete} />
    {:else if currentStep === 'editing'}
      <Editor {videoData} on:complete={handleEditingComplete} />
    {:else if currentStep === 'export'}
      <ExportPanel {videoData} on:complete={handleExportComplete} />
    {:else if currentStep === 'queue'}
      <ProcessingQueue on:close={handleQueueClose} />
    {/if}
  </div>

  <!-- Footer -->
  <footer class="border-t border-gray-800 mt-16 py-8">
    <div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
      <p>ClipForge © 2026 - Better than Opus Clips</p>
    </div>
  </footer>
</main>

<style global>
  :global(body) {
    @apply bg-black text-white;
  }

  :global(*) {
    @apply antialiased;
  }
</style>
