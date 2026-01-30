<script>
  import { createEventDispatcher } from 'svelte';
  import { appStore, processingProgress } from './store.js';

  const dispatch = createEventDispatcher();
  
  export let videoData;

  let exportSettings = {
    formats: {
      tiktok: true,
      reels: true,
      shorts: true,
      linkedin: false,
      twitter: false
    },
    subtitles: true,
    subtitleStyle: 'white-bold',
    branding: false,
    brandingText: '',
    brandingPosition: 'bottom',
    transition: 'fade',
    quality: 'high',
    fps: 30,
    watermark: false
  };

  let exporting = false;
  let exportProgress = 0;
  let exportLogs = [];
  let exportComplete = false;
  let downloadLinks = {};

  const formatConfigs = {
    tiktok: { name: 'TikTok', ratio: '9:16', width: 1080, height: 1920 },
    reels: { name: 'Instagram Reels', ratio: '9:16', width: 1080, height: 1920 },
    shorts: { name: 'YouTube Shorts', ratio: '9:16', width: 1080, height: 1920 },
    linkedin: { name: 'LinkedIn', ratio: '1:1', width: 1080, height: 1080 },
    twitter: { name: 'Twitter/X', ratio: '16:9', width: 1280, height: 720 }
  };

  function startExport() {
    exporting = true;
    exportLogs = [];
    exportProgress = 0;

    const selectedFormats = Object.entries(exportSettings.formats)
      .filter(([_, enabled]) => enabled)
      .map(([format]) => format);

    if (selectedFormats.length === 0) {
      alert('Please select at least one format');
      exporting = false;
      return;
    }

    // Connect WebSocket for export progress
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/export`);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: 'start-export',
        clips: $appStore.clips,
        formats: selectedFormats,
        settings: exportSettings
      }));
    };

    ws.onmessage = (e) => {
      const update = JSON.parse(e.data);
      
      exportProgress = update.progress;
      addLog(`[${update.format}] ${update.message}`);

      if (update.downloadUrl) {
        downloadLinks[update.format] = update.downloadUrl;
      }

      if (update.complete) {
        exporting = false;
        exportComplete = true;
        ws.close();
      }
    };

    ws.onerror = (e) => {
      addLog(`ERROR: ${e.message}`);
      exporting = false;
    };
  }

  function addLog(msg) {
    exportLogs = [...exportLogs, msg];
    setTimeout(() => {
      const logContainer = document.querySelector('[data-export-logs]');
      if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
    }, 0);
  }

  function downloadClips() {
    dispatch('complete');
  }

  function toggleFormat(format) {
    exportSettings.formats[format] = !exportSettings.formats[format];
  }
</script>

<div class="space-y-8">
  <!-- Header -->
  <div>
    <h2 class="text-3xl font-bold">Export Clips</h2>
    <p class="text-gray-400">Choose formats and customize export settings</p>
  </div>

  <!-- Settings Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- Left: Format Selection -->
    <div class="space-y-6">
      <div>
        <h3 class="text-xl font-bold mb-4">Output Formats</h3>
        <div class="space-y-3">
          {#each Object.entries(formatConfigs) as [key, config]}
            <label class="flex items-center gap-3 p-4 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-800 transition">
              <input
                type="checkbox"
                bind:checked={exportSettings.formats[key]}
                class="w-4 h-4"
              />
              <div class="flex-1">
                <p class="font-bold">{config.name}</p>
                <p class="text-sm text-gray-400">{config.ratio} • {config.width}x{config.height}px</p>
              </div>
            </label>
          {/each}
        </div>
      </div>

      <!-- Subtitle Settings -->
      <div>
        <label class="flex items-center gap-3 mb-4 cursor-pointer">
          <input type="checkbox" bind:checked={exportSettings.subtitles} />
          <span class="font-bold">Include Captions</span>
        </label>
        {#if exportSettings.subtitles}
          <div class="space-y-2 pl-7">
            <label class="block text-sm">
              Caption Style
              <select bind:value={exportSettings.subtitleStyle} class="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2">
                <option value="white-bold">White Bold</option>
                <option value="white-shadow">White with Shadow</option>
                <option value="black-white-outline">Black with White Outline</option>
                <option value="auto-contrast">Auto Contrast</option>
              </select>
            </label>
          </div>
        {/if}
      </div>

      <!-- Branding -->
      <div>
        <label class="flex items-center gap-3 mb-4 cursor-pointer">
          <input type="checkbox" bind:checked={exportSettings.branding} />
          <span class="font-bold">Add Branding</span>
        </label>
        {#if exportSettings.branding}
          <div class="space-y-3 pl-7">
            <input
              type="text"
              bind:value={exportSettings.brandingText}
              placeholder="Your brand/watermark text"
              class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
            <label class="block text-sm">
              Position
              <select bind:value={exportSettings.brandingPosition} class="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2">
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="corner">Corner</option>
              </select>
            </label>
          </div>
        {/if}
      </div>
    </div>

    <!-- Right: Advanced Settings -->
    <div class="space-y-6">
      <!-- Quality & Performance -->
      <div>
        <h3 class="text-lg font-bold mb-4">Quality & Performance</h3>
        
        <label class="block mb-4">
          Quality Preset
          <select bind:value={exportSettings.quality} class="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2">
            <option value="high">High (1080p, slow)</option>
            <option value="medium">Medium (720p, balanced)</option>
            <option value="low">Low (480p, fast)</option>
          </select>
        </label>

        <label class="block mb-4">
          Frame Rate
          <select bind:value={exportSettings.fps} class="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2">
            <option value={24}>24 FPS (cinematic)</option>
            <option value={30}>30 FPS (standard)</option>
            <option value={60}>60 FPS (smooth)</option>
          </select>
        </label>

        <label class="block">
          Transition Effect
          <select bind:value={exportSettings.transition} class="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-3 py-2">
            <option value="none">None</option>
            <option value="fade">Fade</option>
            <option value="zoom">Zoom</option>
            <option value="slide">Slide</option>
          </select>
        </label>
      </div>

      <!-- Summary -->
      <div class="bg-gray-900 rounded-lg p-4">
        <h4 class="font-bold mb-3">Export Summary</h4>
        <div class="text-sm text-gray-400 space-y-1">
          <p>📹 Clips: {$appStore.clips.length}</p>
          <p>📋 Formats: {Object.values(exportSettings.formats).filter(Boolean).length}</p>
          <p>🎬 Quality: {exportSettings.quality}</p>
          <p>⏱️ Est. Time: ~5-15 min per clip</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Export Progress -->
  {#if exporting || exportComplete}
    <div class="bg-gray-900 rounded-lg p-6 space-y-4">
      <div>
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-bold">Export Progress</h4>
          <span class="text-sm text-gray-400">{exportProgress}%</span>
        </div>
        <div class="w-full bg-gray-800 rounded-full h-2">
          <div class="bg-red-500 h-2 rounded-full transition-all" style="width: {exportProgress}%"></div>
        </div>
      </div>

      <!-- Logs -->
      <div data-export-logs class="h-32 bg-gray-950 rounded border border-gray-800 overflow-y-auto p-3 font-mono text-xs text-gray-400 space-y-1">
        {#each exportLogs as log}
          <div>{log}</div>
        {/each}
      </div>

      {#if exportComplete}
        <div class="bg-green-900 bg-opacity-20 border border-green-700 rounded p-3">
          <p class="text-green-200 font-bold">✅ Export Complete!</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Download Links -->
  {#if exportComplete && Object.keys(downloadLinks).length > 0}
    <div class="bg-gray-900 rounded-lg p-6">
      <h4 class="font-bold mb-4">Download Your Clips</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each Object.entries(downloadLinks) as [format, url]}
          <a
            href={url}
            download
            class="flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <span>{formatConfigs[format].name}</span>
            <span>⬇️</span>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="flex gap-4 pt-8 border-t border-gray-800">
    <button
      on:click={() => dispatch('back')}
      disabled={exporting}
      class="px-6 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-900 rounded-lg font-medium transition"
    >
      Back
    </button>
    
    {#if !exportComplete}
      <button
        on:click={startExport}
        disabled={exporting || Object.values(exportSettings.formats).every(v => !v)}
        class="ml-auto px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white rounded-lg font-medium transition"
      >
        {exporting ? 'Exporting...' : 'Start Export'}
      </button>
    {:else}
      <button
        on:click={downloadClips}
        class="ml-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
      >
        Done
      </button>
    {/if}
  </div>
</div>
