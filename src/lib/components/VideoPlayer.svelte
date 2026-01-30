<script>
  import { onMount } from 'svelte';

  export let clip;
  export let videoPath = '';

  let videoElement;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;

  onMount(() => {
    if (videoElement && clip) {
      videoElement.addEventListener('timeupdate', () => {
        currentTime = videoElement.currentTime;
      });

      videoElement.addEventListener('loadedmetadata', () => {
        duration = videoElement.duration;
      });

      // Seek to clip start
      videoElement.currentTime = clip.start || 0;
    }
  });

  function togglePlay() {
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      isPlaying = !isPlaying;
    }
  }

  function formatTime(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
</script>

<div class="space-y-3">
  {#if videoPath}
    <div class="relative bg-black rounded-lg overflow-hidden aspect-video">
      <video
        bind:this={videoElement}
        src={videoPath}
        class="w-full h-full"
        controls
      />
    </div>

    <!-- Timeline -->
    <div class="bg-gray-950 rounded-lg p-3">
      <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(clip.end - clip.start)}</span>
      </div>

      <!-- Clip Range Indicator -->
      <div class="relative h-8 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
        <!-- Track -->
        <div
          class="absolute h-full bg-gray-700"
          style="left: {(clip.start / duration) * 100}%; right: {100 - (clip.end / duration) * 100}%; opacity: 0.3;"
        ></div>

        <!-- Highlight -->
        <div
          class="absolute h-full bg-red-500 opacity-50"
          style="left: {(clip.start / duration) * 100}%; width: {((clip.end - clip.start) / duration) * 100}%;"
        ></div>

        <!-- Current position -->
        {#if duration > 0}
          <div
            class="absolute top-0 w-1 h-full bg-white"
            style="left: {(currentTime / duration) * 100}%;"
          ></div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="aspect-video bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">
      <p>No video preview available</p>
    </div>
  {/if}
</div>
