import pino from 'pino';
import { createClient } from '../utils/llm-client.js';

const logger = pino();

/**
 * Use AI to detect the best moments in video
 * Analyzes transcript for:
 * - Emotional peaks (excitement, surprise, laughter)
 * - Key insights and takeaways
 * - Humor and funny moments
 * - Story beats (beginning, climax, resolution)
 * - Audience engagement cues
 */
export async function analyzeForClips(transcript, options = {}) {
  const { videoDuration = 600, maxClips = 10, minClipDuration = 15, maxClipDuration = 60 } = options;

  const client = createClient('claude'); // Use Claude for superior analysis

  const prompt = `
You are a viral content expert analyzing a video transcript to find the best clips for social media (TikTok, Reels, Shorts).

Transcript:
${transcript.text}

Timestamps (speaker name, start time):
${transcript.segments?.map(s => `${s.start.toFixed(2)}s - ${s.end.toFixed(2)}s: "${s.text}"`).join('\n')}

Video Duration: ${videoDuration} seconds
Constraints:
- Minimum clip duration: ${minClipDuration}s
- Maximum clip duration: ${maxClipDuration}s
- Find up to ${maxClips} best moments

For EACH moment you identify, provide:
1. Start time (seconds)
2. End time (seconds)
3. Reason (one of: HUMOR, INSIGHT, EMOTIONAL_PEAK, STORY_BEAT, CONTROVERSY, PATTERN_BREAK, CALL_TO_ACTION, TRENDING_TOPIC)
4. Confidence score (0-100)
5. Hook sentence (what would grab attention in first 2 seconds)

Format as JSON array:
[
  {
    "start": 12.5,
    "end": 45.3,
    "reason": "HUMOR",
    "confidence": 95,
    "hook": "Wait until the end..."
  }
]

Important:
- Prioritize moments with high engagement potential
- Include trend-riding opportunities
- Find emotional hooks (surprise, joy, anger, curiosity)
- Include audience participation moments
- Look for teachable/shareable insights
- Identify controversial or divisive statements
- Find the most quotable lines

Return ONLY the JSON array, no other text.
`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    let moments = [];
    
    try {
      const content = response.content[0].text.trim();
      // Extract JSON from response (handles markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        moments = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      logger.warn('Failed to parse AI response, using fallback');
      moments = generateFallbackMoments(transcript, videoDuration);
    }

    // Validate and filter moments
    moments = moments
      .filter(m => {
        const duration = m.end - m.start;
        return duration >= minClipDuration && duration <= maxClipDuration;
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxClips)
      .map((m, i) => ({
        ...m,
        id: `moment-${i}`,
        score: m.confidence
      }));

    logger.info(`Detected ${moments.length} moments`);
    return { moments, transcript };
  } catch (error) {
    logger.error(error, 'AI analysis failed, using fallback');
    return {
      moments: generateFallbackMoments(transcript, videoDuration),
      transcript
    };
  }
}

/**
 * Fallback moment detection (simple heuristics)
 */
function generateFallbackMoments(transcript, videoDuration) {
  const moments = [];
  const segments = transcript.segments || [];

  // Strategy 1: Find segments with exclamation marks (excitement)
  segments.forEach((seg, i) => {
    if (seg.text.includes('!') && seg.text.length > 20) {
      moments.push({
        start: Math.max(0, seg.start - 2),
        end: Math.min(videoDuration, seg.end + 3),
        reason: 'EMOTIONAL_PEAK',
        confidence: 70,
        hook: seg.text.substring(0, 50)
      });
    }
  });

  // Strategy 2: Find longer coherent thoughts (insights)
  for (let i = 0; i < segments.length - 2; i++) {
    const combined = segments.slice(i, i + 3).map(s => s.text).join(' ');
    if (combined.length > 100) {
      moments.push({
        start: segments[i].start,
        end: segments[i + 2].end,
        reason: 'INSIGHT',
        confidence: 65,
        hook: combined.substring(0, 50)
      });
    }
  }

  // Remove duplicates and sort by confidence
  const unique = Array.from(
    new Map(moments.map(m => [
      `${m.start.toFixed(0)}-${m.end.toFixed(0)}`,
      m
    ])).values()
  );

  return unique
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10)
    .map((m, i) => ({ ...m, id: `moment-${i}` }));
}

/**
 * Analyze sentiment for emotional clips
 */
export async function analyzeSentiment(text) {
  const client = createClient('claude');

  try {
    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Analyze sentiment of: "${text}"\n\nRespond with JSON: {"sentiment": "positive|negative|neutral", "intensity": 0-100}`
        }
      ]
    });

    return JSON.parse(response.content[0].text);
  } catch (error) {
    logger.error(error, 'Sentiment analysis failed');
    return { sentiment: 'neutral', intensity: 50 };
  }
}
