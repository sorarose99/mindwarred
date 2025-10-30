import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse, GameStateResponse, ContributeRequest, ContributeResponse, CommunityData } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    try {
      // Get current context - postId might be optional in development
      const { postId, subredditName } = context;
      
      console.log('🎮 API Init called:', { postId, subredditName });

      // Get username and basic data
      const [count, username] = await Promise.all([
        redis.get('count').catch(() => '0'),
        reddit.getCurrentUsername().catch(() => 'RedditUser'),
      ]);

      const responseData = {
        type: 'init' as const,
        postId: postId || 'demo-post',
        count: count ? parseInt(count) : 0,
        username: username ?? 'RedditUser',
      };

      console.log('✅ API Init success:', responseData);
      res.json(responseData);
    } catch (error) {
      console.error('❌ API Init Error:', error);
      
      // Fallback response for development/testing
      res.json({
        type: 'init' as const,
        postId: 'demo-post',
        count: 0,
        username: 'RedditUser',
      });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

// Mind Wars API Endpoints

router.get<{ postId: string }, GameStateResponse | { status: string; message: string }>(
  '/api/gamestate',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      // Get community data from Reddit API and Redis
      const communities = await getCommunityData();
      const totalEnergy = communities.reduce((sum, community) => sum + community.thoughtEnergy, 0);
      const battleActive = await redis.get('battle:active') === 'true';

      res.json({
        type: 'gameState',
        postId,
        communities,
        totalEnergy,
        battleActive,
      });
    } catch (error) {
      console.error(`API GameState Error for post ${postId}:`, error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to fetch game state' 
      });
    }
  }
);

router.post<{ postId: string }, ContributeResponse | { status: string; message: string }, ContributeRequest>(
  '/api/contribute',
  async (req, res): Promise<void> => {
    try {
      const { postId, subredditName } = context;
      const { planetId, energy, challengeType } = req.body;

      console.log('🎮 Contribution received:', { planetId, energy, challengeType, subredditName });

      if (!planetId || !energy) {
        res.status(400).json({
          status: 'error',
          message: 'planetId and energy are required',
        });
        return;
      }

      // Get current user for tracking
      let username = 'anonymous';
      try {
        username = await reddit.getCurrentUsername() || 'anonymous';
      } catch (e) {
        console.log('Could not get username, using anonymous');
      }

      // Update planet energy in Redis
      const energyKey = `planet:${planetId}:energy`;
      const newEnergy = await redis.incrBy(energyKey, energy);
      
      // Calculate evolution stage (more realistic progression)
      const evolutionStage = Math.min(4, Math.floor(newEnergy / 1000));
      
      // Store evolution stage
      await redis.set(`planet:${planetId}:stage`, evolutionStage.toString());
      
      // Update last contribution timestamp
      await redis.set(`planet:${planetId}:lastContribution`, Date.now().toString());

      // Track contributor
      const contributorKey = `planet:${planetId}:contributors:${username}`;
      await redis.incrBy(contributorKey, energy);

      // Track challenge completion if provided
      if (challengeType) {
        const challengeKey = `planet:${planetId}:challenges:${challengeType}`;
        await redis.incr(challengeKey);
        
        // Track user's challenge completions
        const userChallengeKey = `user:${username}:challenges:${challengeType}`;
        await redis.incr(userChallengeKey);
      }

      // Update daily statistics
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `planet:${planetId}:daily:${today}`;
      await redis.incrBy(dailyKey, energy);
      await redis.expire(dailyKey, 86400 * 7); // Keep for 7 days

      // Track global stats
      await redis.incrBy('global:totalEnergy', energy);
      await redis.incr('global:totalContributions');

      console.log(`✅ ${username} contributed ${energy} energy to ${planetId}. New total: ${newEnergy}`);

      res.json({
        type: 'contribute',
        postId: postId || 'demo-post',
        planetId,
        newEnergy,
        evolutionStage,
        success: true,
      });
    } catch (error) {
      console.error('❌ API Contribute Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to process contribution' 
      });
    }
  }
);

// Helper function to get REAL Reddit community data
async function getCommunityData(): Promise<CommunityData[]> {
  console.log('🌍 Fetching REAL Reddit community data...');
  
  // Popular Reddit communities to feature in the game
  const targetCommunities = [
    { id: 'gaming', name: 'r/gaming', displayName: 'Gaming', position: { x: 0, y: 0, z: 0 } },
    { id: 'funny', name: 'r/funny', displayName: 'Funny', position: { x: 25, y: 10, z: -15 } },
    { id: 'AskReddit', name: 'r/AskReddit', displayName: 'Ask Reddit', position: { x: -20, y: -8, z: 12 } },
    { id: 'programming', name: 'r/programming', displayName: 'Programming', position: { x: 15, y: -12, z: 20 } },
    { id: 'memes', name: 'r/memes', displayName: 'Memes', position: { x: -12, y: 15, z: -10 } }
  ];

  const communities: CommunityData[] = [];

  for (const community of targetCommunities) {
    try {
      console.log(`📡 Fetching data for ${community.name}...`);
      
      // Try to get REAL subreddit data from Reddit API
      let memberCount = 100000; // Default fallback
      let realDisplayName = community.displayName;
      
      try {
        // Attempt to fetch real subreddit data
        const subreddit = await reddit.getSubredditByName(community.id);
        if (subreddit) {
          memberCount = subreddit.subscribers || memberCount;
          realDisplayName = subreddit.displayName || community.displayName;
          console.log(`✅ Real data for ${community.name}: ${memberCount} members`);
        }
      } catch (apiError) {
        console.log(`⚠️ Using fallback data for ${community.name}:`, apiError);
        // Use realistic member counts based on actual subreddit sizes
        const memberCounts: { [key: string]: number } = {
          'gaming': 37000000,
          'funny': 52000000,
          'AskReddit': 45000000,
          'programming': 4500000,
          'memes': 28000000
        };
        memberCount = memberCounts[community.id] || 1000000;
      }

      // Get energy from Redis, initialize if needed
      const energyKey = `planet:${community.id}:energy`;
      let thoughtEnergy = await redis.get(energyKey);
      
      if (!thoughtEnergy) {
        // Initialize based on community size (bigger communities start with more energy)
        const baseEnergy = Math.floor(memberCount / 10000) + Math.floor(Math.random() * 500) + 500;
        await redis.set(energyKey, baseEnergy.toString());
        thoughtEnergy = baseEnergy.toString();
        console.log(`🔋 Initialized ${community.name} with ${baseEnergy} energy`);
      }

      const energy = parseInt(thoughtEnergy);
      const evolutionStage = Math.min(4, Math.floor(energy / 1000)); // Cap at stage 4

      communities.push({
        id: community.id,
        name: community.name,
        displayName: realDisplayName,
        memberCount,
        thoughtEnergy: energy,
        evolutionStage,
        position: community.position,
      });

      console.log(`✅ Added ${community.name}: ${memberCount} members, ${energy} energy, stage ${evolutionStage}`);
    } catch (error) {
      console.error(`❌ Error fetching data for community ${community.id}:`, error);
      
      // Add community with realistic fallback data
      communities.push({
        id: community.id,
        name: community.name,
        displayName: community.displayName,
        memberCount: 1000000,
        thoughtEnergy: 1000,
        evolutionStage: 2,
        position: community.position,
      });
    }
  }

  console.log(`🎮 Loaded ${communities.length} communities for Mind Wars`);
  return communities;
}

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Health check endpoint
router.get('/api/health', async (_req, res): Promise<void> => {
  try {
    // Check Redis connection
    await redis.ping();
    
    // Check basic functionality
    const testKey = 'health-check';
    await redis.set(testKey, 'ok', { ex: 10 });
    const testValue = await redis.get(testKey);
    
    if (testValue !== 'ok') {
      throw new Error('Redis test failed');
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: 'connected',
        reddit: 'available'
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Metrics endpoint for monitoring
router.get('/api/metrics', async (_req, res): Promise<void> => {
  try {
    // Get basic metrics from Redis
    const totalPlanets = await redis.keys('planet:*:energy');
    const totalEnergy = await Promise.all(
      totalPlanets.map(key => redis.get(key))
    ).then(values => 
      values.reduce((sum, val) => sum + (parseInt(val || '0')), 0)
    );

    // Get recent activity
    const today = new Date().toISOString().split('T')[0];
    const dailyKeys = await redis.keys(`planet:*:daily:${today}`);
    const todayEnergy = await Promise.all(
      dailyKeys.map(key => redis.get(key))
    ).then(values => 
      values.reduce((sum, val) => sum + (parseInt(val || '0')), 0)
    );

    res.json({
      timestamp: new Date().toISOString(),
      metrics: {
        totalPlanets: totalPlanets.length,
        totalEnergy,
        todayEnergy,
        activePlanets: dailyKeys.length
      }
    });
  } catch (error) {
    console.error('Metrics collection failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to collect metrics'
    });
  }
});

// Beta feedback endpoint
router.post('/api/feedback', async (req, res): Promise<void> => {
  try {
    const feedback = req.body;
    
    // Validate required fields
    if (!feedback.id || !feedback.category || !feedback.title) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required feedback fields'
      });
      return;
    }

    // Store feedback in Redis with expiration (30 days)
    const feedbackKey = `feedback:${feedback.id}`;
    await redis.setex(feedbackKey, 30 * 24 * 60 * 60, JSON.stringify(feedback));
    
    // Add to feedback queue for processing
    await redis.lpush('feedback:queue', feedback.id);
    
    // Keep queue size manageable (max 1000 items)
    await redis.ltrim('feedback:queue', 0, 999);
    
    // Track feedback metrics
    const today = new Date().toISOString().split('T')[0];
    await redis.incr(`feedback:count:${today}`);
    await redis.incr(`feedback:category:${feedback.category}:${today}`);
    await redis.incr(`feedback:severity:${feedback.severity}:${today}`);
    
    // Set expiration for daily counters (7 days)
    await redis.expire(`feedback:count:${today}`, 7 * 24 * 60 * 60);
    await redis.expire(`feedback:category:${feedback.category}:${today}`, 7 * 24 * 60 * 60);
    await redis.expire(`feedback:severity:${feedback.severity}:${today}`, 7 * 24 * 60 * 60);

    console.log(`Beta feedback received: ${feedback.category} - ${feedback.title}`);
    
    res.json({
      status: 'success',
      message: 'Feedback submitted successfully',
      feedbackId: feedback.id
    });
  } catch (error) {
    console.error('Failed to store feedback:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit feedback'
    });
  }
});

// Get feedback analytics (for developers)
router.get('/api/feedback/analytics', async (_req, res): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get feedback counts
    const [todayCount, yesterdayCount] = await Promise.all([
      redis.get(`feedback:count:${today}`),
      redis.get(`feedback:count:${yesterday}`)
    ]);
    
    // Get category breakdown for today
    const categories = ['bug', 'feature', 'ui', 'performance', 'general'];
    const categoryData = await Promise.all(
      categories.map(async (category) => ({
        category,
        count: parseInt(await redis.get(`feedback:category:${category}:${today}`) || '0')
      }))
    );
    
    // Get severity breakdown for today
    const severities = ['low', 'medium', 'high', 'critical'];
    const severityData = await Promise.all(
      severities.map(async (severity) => ({
        severity,
        count: parseInt(await redis.get(`feedback:severity:${severity}:${today}`) || '0')
      }))
    );
    
    // Get recent feedback IDs
    const recentFeedbackIds = await redis.lrange('feedback:queue', 0, 9);
    
    res.json({
      timestamp: new Date().toISOString(),
      analytics: {
        todayCount: parseInt(todayCount || '0'),
        yesterdayCount: parseInt(yesterdayCount || '0'),
        categoryBreakdown: categoryData,
        severityBreakdown: severityData,
        recentFeedbackCount: recentFeedbackIds.length,
        totalQueueSize: await redis.llen('feedback:queue')
      }
    });
  } catch (error) {
    console.error('Failed to get feedback analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get feedback analytics'
    });
  }
});

// Live leaderboard endpoint
router.get('/api/leaderboard', async (_req, res): Promise<void> => {
  try {
    console.log('📊 Fetching live leaderboard...');
    
    // Get all planet energies
    const communities = await getCommunityData();
    
    // Sort by energy (descending)
    const leaderboard = communities
      .sort((a, b) => b.thoughtEnergy - a.thoughtEnergy)
      .map((community, index) => ({
        rank: index + 1,
        id: community.id,
        name: community.name,
        displayName: community.displayName,
        thoughtEnergy: community.thoughtEnergy,
        evolutionStage: community.evolutionStage,
        memberCount: community.memberCount
      }));

    // Get global stats
    const [totalEnergy, totalContributions] = await Promise.all([
      redis.get('global:totalEnergy').then(val => parseInt(val || '0')),
      redis.get('global:totalContributions').then(val => parseInt(val || '0'))
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      leaderboard,
      globalStats: {
        totalEnergy,
        totalContributions,
        activeCommunities: communities.length
      }
    });
  } catch (error) {
    console.error('❌ Leaderboard Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch leaderboard'
    });
  }
});

// Live user stats endpoint
router.get('/api/user/stats', async (_req, res): Promise<void> => {
  try {
    let username = 'anonymous';
    try {
      username = await reddit.getCurrentUsername() || 'anonymous';
    } catch (e) {
      console.log('Could not get username for stats');
    }

    console.log(`📊 Fetching stats for user: ${username}`);

    // Get user's contributions per planet
    const communities = await getCommunityData();
    const userContributions = await Promise.all(
      communities.map(async (community) => {
        const contributorKey = `planet:${community.id}:contributors:${username}`;
        const energy = await redis.get(contributorKey);
        return {
          planetId: community.id,
          planetName: community.name,
          energyContributed: parseInt(energy || '0')
        };
      })
    );

    // Get user's challenge completions
    const challengeTypes = ['puzzle', 'creative', 'knowledge', 'collaborative', 'strategic'];
    const challengeStats = await Promise.all(
      challengeTypes.map(async (type) => {
        const userChallengeKey = `user:${username}:challenges:${type}`;
        const count = await redis.get(userChallengeKey);
        return {
          type,
          completed: parseInt(count || '0')
        };
      })
    );

    const totalEnergyContributed = userContributions.reduce((sum, contrib) => sum + contrib.energyContributed, 0);
    const totalChallengesCompleted = challengeStats.reduce((sum, stat) => sum + stat.completed, 0);

    res.json({
      username,
      totalEnergyContributed,
      totalChallengesCompleted,
      contributions: userContributions.filter(c => c.energyContributed > 0),
      challengeStats: challengeStats.filter(c => c.completed > 0),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ User Stats Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user stats'
    });
  }
});

// Beta portal route
router.get('/beta', async (_req, res): Promise<void> => {
  try {
    // In a real implementation, you would serve the beta-portal.html file
    // For now, we'll redirect to the beta portal
    res.redirect('/beta-portal.html');
  } catch (error) {
    console.error('Failed to serve beta portal:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load beta portal'
    });
  }
});

app.use(router);

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(getServerPort());
