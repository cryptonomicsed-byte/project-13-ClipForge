<script>
  import { createEventDispatcher } from 'svelte';
  import { appStore, processingProgress } from './store.js';

  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = null;
  let dragActive = false;
  let uploadMode = 'file'; // file | url | youtube
  let urlInput = '';
  let fileInput;

  async function handleUpload(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav'];
    
    if (!validTypes.some(t => file.type.startsWith(t.split('/')[0]))) {
      error = 'Invalid file type. Please upload video or audio.';
      return;
    }

    if (file.size > 10 * 1024 * 1024 * 1024) { // 10GB
      error = 'File too large. Max 10GB.';
      return;
    }

    await processFile(file);
  }

  async function processFile(file) {
    loading = true;
    error = null;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      appStore.setVideo({
        id: data.id,
        filename: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
        filepath: data.filepath,
        duration: data.duration || null
      });

      dispatch('complete', {
        id: data.id,
        filename: file.name,
        filepath: data.filepath
      });
    } catch (e) {
      error = e.message || 'Upload failed';
    } finally {
      loading = false;
    }
  }

  async function handleURLUpload() {
    if (!urlInput.trim()) {
      error = 'Please enter a URL';
      return;
    }

    loading = true;
    error = null;

    try {
      const isYouTube = urlInput.includes('youtube.com') || urlInput.includes('youtu.be');
      
      const response = await fetch('/api/download-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput,
          type: isYouTube ? 'youtube' : 'generic'
        })
      });

      if (!response.ok) throw new Error('Download failed');

      const data = await response.json();

      appStore.setVideo({
        id: data.id,
        filename: data.filename,
        type: 'video/mp4',
        size: data.size,
        uploadedAt: new Date(),
        filepath: data.filepath,
        duration: data.duration,
        sourceUrl: urlInput
      });

      dispatch('complete', {
        id: data.id,
        filename: data.filename,
        filepath: data.filepath
      });
    } catch (e) {
      error = e.message || 'Download failed';
    } finally {
      loading = false;
    }
  }

  function handleDragEnter(e) {
    e.preventDefault();
    dragActive = true;
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragActive = false;
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    dragActive = false;
    if (e.dataTransfer.files) {
      handleUpload(e.dataTransfer.files);
    }
  }
</script>

<div class="space-y-8">
  <!-- Title -->
  <div class="text-center space-y-3">
    <h2 class="text-4xl font-bold">Create Viral Clips</h2>
    <p class="text-gray-400 text-lg">Upload your video and let AI find the best moments</p>
  </div>

  <!-- Mode Selector -->
  <div class="flex justify-center gap-4">
    {#each [
      { id: 'file', label: 'Upload File', icon: '📁' },
      { id: 'url', label: 'URL', icon: '🔗' },
      { id: 'youtube', label: 'YouTube', icon: '▶️' }
    ] as mode}
      <button
        on:click={() => uploadMode = mode.id}
        class={`px-6 py-2 rounded-lg font-medium transition ${
          uploadMode === mode.id
            ? 'bg-red-500 text-white'
            : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
        }`}
      >
        {mode.icon} {mode.label}
      </button>
    {/each}
  </div>

  <!-- Upload Zone -->
  <div
    on:dragenter={handleDragEnter}
    on:dragleave={handleDragLeave}
    on:dragover={handleDragOver}
    on:drop={handleDrop}
    class={`border-2 border-dashed rounded-xl p-12 text-center transition ${
      dragActive
        ? 'border-red-500 bg-red-500 bg-opacity-10'
        : 'border-gray-700 hover:border-gray-600'
    }`}
  >
    {#if uploadMode === 'file'}
      <input
        bind:this={fileInput}
        type="file"
        accept="video/*,audio/*"
        on:change={(e) => handleUpload(e.target.files)}
        class="hidden"
      />
      
      <button
        on:click={() => fileInput.click()}
        disabled={loading}
        class="mx-auto block mb-4 text-4xl"
      >
        📹
      </button>
      
      <h3 class="text-2xl font-bold mb-2">Upload Video or Audio</h3>
      <p class="text-gray-400 mb-4">Drag and drop or click to select</p>
      <p class="text-sm text-gray-500">MP4, WebM, MOV, MP3, WAV • Max 10GB</p>
      
      <button
        on:click={() => fileInput.click()}
        disabled={loading}
        class="mt-6 px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white rounded-lg font-medium transition"
      >
        {loading ? 'Uploading...' : 'Select File'}
      </button>
    {:else if uploadMode === 'url' || uploadMode === 'youtube'}
      <div class="text-4xl mb-4">🔗</div>
      <h3 class="text-2xl font-bold mb-2">
        {uploadMode === 'youtube' ? 'YouTube' : 'URL'} Link
      </h3>
      
      <div class="max-w-md mx-auto">
        <input
          bind:value={urlInput}
          placeholder={uploadMode === 'youtube' 
            ? 'https://youtube.com/watch?v=...' 
            : 'https://...'}
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4"
          disabled={loading}
        />
        
        <button
          on:click={handleURLUpload}
          disabled={loading}
          class="w-full px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white rounded-lg font-medium transition"
        >
          {loading ? 'Downloading...' : 'Download & Process'}
        </button>
      </div>
    {/if}
  </div>

  <!-- Error Message -->
  {#if error}
    <div class="bg-red-900 bg-opacity-20 border border-red-500 text-red-200 rounded-lg p-4">
      {error}
    </div>
  {/if}

  <!-- Features -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
    {#each [
      { icon: '✨', title: 'AI Detection', desc: 'Automatically finds the best moments' },
      { icon: '🎬', title: 'Multi-Format', desc: 'Export for TikTok, Reels, Shorts' },
      { icon: '⚡', title: 'Fast Processing', desc: 'Get results in minutes' }
    ] as feature}
      <div class="bg-gray-900 rounded-lg p-6 text-center">
        <div class="text-3xl mb-2">{feature.icon}</div>
        <h4 class="font-bold mb-2">{feature.title}</h4>
        <p class="text-sm text-gray-400">{feature.desc}</p>
      </div>
    {/each}
  </div>
</div>
