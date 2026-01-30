<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { appStore, processingProgress } from './store.js';
  import ProgressBar from './components/ProgressBar.svelte';

  const dispatch = createEventDispatcher();
  
  export let videoData;

  let ws = null;
  let currentStep = '';
  let progress = 0;
  let message = '';
  let startTime = null;
  let logs = [];

  const steps = [
    { id: 'download', label: 'Downloading', icon: '⬇️' },
    { id: 'transcribe', label: 'Transcribing', icon: '🎤' },
    { id: 'analyze', label: 'Analyzing', icon: '🤖' },
    { id: 'extract', label: 'Extracting Clips', icon: '✂️' },
    { id: 'complete', label: 'Complete', icon: '✅' }
  ];

  onMount(() => {
    startProcessing();

    return () => {
      if (ws) ws.close();
    };
  });

  function startProcessing() {
    startTime = Date.now();
    
    // Connect WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws/process/${videoData.id}`);

    ws.onmessage = (e) => {
      const update = JSON.parse(e.data);
      
      currentStep = update.step;
      progress = update.progress;
      message = update.message;
      
      addLog(`[${update.step}] ${update.message}`);

      processingProgress.set({
        step: update.step,
        progress: update.progress,
        message: update.message,
        startTime,
        estimatedTime: update.estimatedTime
      });

      if (update.complete) {
        appStore.setDetectedClips(update.clips);
        appStore.setProcessingComplete(true);
        dispatch('complete');
      }
    };

    ws.onerror = (e) => {
      addLog(`ERROR: ${e.message}`);
      appStore.setError(`Processing error: ${e.message}`);
    };

    // Initiate processing
    sendToServer({
      action: 'start',
      videoId: videoData.id,
      filename: videoData.filename
    });
  }

  function sendToServer(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function addLog(msg) {
    logs = [...logs, { time: new Date().toLocaleTimeString(), msg }];
    // Auto-scroll logs
    setTimeout(() => {
      const logContainer = document.querySelector('[data-logs]');
      if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
    }, 0);
  }

  function formatTime(ms) {
    if (!ms) return '';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="text-center space-y-2">
    <h2 class="text-3xl font-bold">Processing Your Video</h2>
    <p class="text-gray-400">AI is analyzing and extracting the best moments</p>
  </div>

  <!-- Progress Stepper -->
  <div class="bg-gray-900 rounded-lg p-8">
    <div class="space-y-6">
      {#each steps as step, i}
        <div class="flex items-center gap-4">
          <div class={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
            currentStep === step.id
              ? 'bg-red-500 text-white animate-pulse'
              : steps.findIndex(s => s.id === currentStep) > i
              ? 'bg-green-500 text-white'
              : 'bg-gray-700 text-gray-400'
          }`}>
            {step.icon}
          </div>
          <div class="flex-1">
            <h4 class="font-bold">{step.label}</h4>
            {#if currentStep === step.id}
              <div class="mt-2">
                <ProgressBar value={progress} max={100} />
                <p class="text-sm text-gray-400 mt-2">{message}</p>
              </div>
            {/if}
          </div>
          {#if steps.findIndex(s => s.id === currentStep) > i}
            <span class="text-green-500 font-bold">✓</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-gray-900 rounded-lg p-4 text-center">
      <p class="text-gray-400 text-sm">Elapsed Time</p>
      <p class="text-2xl font-bold">{formatTime(Date.now() - startTime)}</p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 text-center">
      <p class="text-gray-400 text-sm">Progress</p>
      <p class="text-2xl font-bold">{progress}%</p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 text-center">
      <p class="text-gray-400 text-sm">Current Step</p>
      <p class="text-2xl font-bold">{steps.find(s => s.id === currentStep)?.label || 'Starting...'}</p>
    </div>
  </div>

  <!-- Logs -->
  <div class="bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
    <div class="bg-gray-900 px-4 py-2 border-b border-gray-800">
      <p class="text-sm font-bold">Processing Logs</p>
    </div>
    <div data-logs class="h-48 overflow-y-auto p-4 font-mono text-xs space-y-1">
      {#each logs as log}
        <div class="text-gray-400">
          <span class="text-gray-600">{log.time}</span>
          <span class="text-gray-300 ml-2">{log.msg}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Tips -->
  <div class="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
    <p class="font-bold mb-2">💡 Processing Tips</p>
    <ul class="text-sm text-gray-300 space-y-1 list-disc list-inside">
      <li>Longer videos may take longer to process</li>
      <li>Ensure good audio quality for better transcription</li>
      <li>The more dramatic moments, the better clips we detect</li>
    </ul>
  </div>
</div>
