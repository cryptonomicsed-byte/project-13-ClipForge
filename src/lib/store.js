import { writable } from 'svelte/store';

export const appStore = (() => {
  const initialState = {
    currentVideo: null,
    clips: [],
    detectedClips: [],
    processingComplete: false,
    exportSettings: {
      formats: ['tiktok', 'reels', 'shorts'],
      includeSubtitles: true,
      includeBranding: false,
      brandingText: '',
      transitionType: 'fade',
      qualityPreset: 'high'
    },
    processingQueue: [],
    processingActive: false,
    lastError: null
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    setVideo: (video) => update(s => ({ ...s, currentVideo: video })),
    setDetectedClips: (clips) => update(s => ({ ...s, detectedClips: clips })),
    setProcessingComplete: (complete) => update(s => ({ ...s, processingComplete: complete })),
    setClips: (clips) => update(s => ({ ...s, clips })),
    addClip: (clip) => update(s => ({ ...s, clips: [...s.clips, clip] })),
    removeClip: (id) => update(s => ({ ...s, clips: s.clips.filter(c => c.id !== id) })),
    updateClip: (id, data) => update(s => ({
      ...s,
      clips: s.clips.map(c => c.id === id ? { ...c, ...data } : c)
    })),
    setExportSettings: (settings) => update(s => ({ ...s, exportSettings: { ...s.exportSettings, ...settings } })),
    addToQueue: (item) => update(s => ({ ...s, processingQueue: [...s.processingQueue, item] })),
    removeFromQueue: (id) => update(s => ({ ...s, processingQueue: s.processingQueue.filter(i => i.id !== id) })),
    setProcessingActive: (active) => update(s => ({ ...s, processingActive: active })),
    setError: (error) => update(s => ({ ...s, lastError: error })),
    reset: () => set(initialState)
  };
})();

export const processingProgress = writable({
  step: '', // download, transcribe, analyze, extract, process
  progress: 0,
  message: '',
  startTime: null,
  estimatedTime: null
});

export const clipPreview = writable({
  clip: null,
  playing: false,
  currentTime: 0
});
