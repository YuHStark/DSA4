'use strict';

const express = require('express');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');

const app = express();

// This object will store user preferences across the session
const userProfiles = {};

app.get('/', (req, res) => {
  res.send('Book Recommendation Webhook is running!');
});

app.post('/webhook', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(req.body));
  
  // Get or create user session ID
  const sessionId = agent.session.split('/').pop();
  if (!userProfiles[sessionId]) {
    userProfiles[sessionId] = {
      preferredGenres: [],
      preferredMethods: [],
      visitedTopics: [],
      questions: []
    };
  }

  // Function to add follow-up questions and track user interactions
  function trackAndPrompt(agent, topic) {
    // Track that user has visited this topic
    if (!userProfiles[sessionId].visitedTopics.includes(topic)) {
      userProfiles[sessionId].visitedTopics.push(topic);
    }
    
    // Add contextual follow-up questions based on user's history
    if (userProfiles[sessionId].visitedTopics.length > 1 && userProfiles[sessionId].visitedTopics.length < 4) {
      agent.add('I see you\'re interested in multiple aspects of book recommendation systems. Would you like me to explain how they work together?');
      agent.add(new Suggestion('Yes, explain integration'));
      agent.add(new Suggestion('No thanks'));
    }
  }

  // Content-Based Follow-up - Ask for genre preferences
  function askForGenrePreferences(agent) {
    // This function runs after Dialogflow's static response
    agent.add('I\'d like to personalize your experience. What genre of books do you typically enjoy reading?');
    agent.add(new Suggestion('Mystery'));
    agent.add(new Suggestion('Science Fiction'));
    agent.add(new Suggestion('Romance'));
    agent.add(new Suggestion('Non-fiction'));
  }

  // Collect genre preference
  function collectGenrePreference(agent) {
    const genre = agent.parameters.genre;
    if (genre && genre !== '') {
      userProfiles[sessionId].preferredGenres.push(genre);
      agent.add(`Great! I've noted that you enjoy ${genre} books.`);
      
      // Provide a personalized recommendation about content-based filtering
      agent.add(`For ${genre} books, content-based filtering would analyze themes, writing style, and plot elements common in this genre.`);
      agent.add('Would you like to learn how we evaluate recommendation quality for your preferred genre?');
      agent.add(new Suggestion('Tell me more'));
      agent.add(new Suggestion('Not now'));
    } else {
      agent.add('I didn\'t catch which genre you prefer. Could you mention a specific book genre?');
    }
  }

  // Rating-based Follow-up - Ask about rating habits
  function askAboutRatingHabits(agent) {
    agent.add('Do you typically rate books after reading them? This helps recommendation systems work better.');
    agent.add(new Suggestion('Yes, always'));
    agent.add(new Suggestion('Sometimes'));
    agent.add(new Suggestion('Rarely'));
  }

  // Collect rating habits
  function collectRatingHabits(agent) {
    const ratingFrequency = agent.parameters.frequency;
    userProfiles[sessionId].ratingHabit = ratingFrequency;
    
    if (ratingFrequency === 'always' || ratingFrequency === 'sometimes') {
      agent.add(`Since you ${ratingFrequency} rate books, rating-based filtering would be very effective for you!`);
    } else {
      agent.add('Even with fewer ratings, the system can still work well by using the +10 smoothing factor I mentioned.');
    }
    
    // Ask a follow-up to engage further
    agent.add('Would you prefer recommendations based on your ratings or based on book content?');
    agent.add(new Suggestion('Ratings-based'));
    agent.add(new Suggestion('Content-based'));
  }

  // Record user questions for future analysis
  function recordQuestion(agent) {
    // Extract the original query
    const query = agent.query;
    if (query && query !== '') {
      userProfiles[sessionId].questions.push(query);
    }
    
    // Log all the information we've collected about this user
    console.log(`User profile for ${sessionId}:`, userProfiles[sessionId]);
    
    // Let Dialogflow handle the standard response
  }

  // Generate personalized summary based on collected information
  function generateSummary(agent) {
    const profile = userProfiles[sessionId];
    let summary = "Based on our conversation, I can tell you that:\n\n";
    
    if (profile.preferredGenres.length > 0) {
      summary += `- You enjoy ${profile.preferredGenres.join(', ')} books\n`;
    }
    
    if (profile.ratingHabit) {
      summary += `- You ${profile.ratingHabit} rate books after reading them\n`;
    }
    
    if (profile.visitedTopics.length > 0) {
      summary += `- You've shown interest in ${profile.visitedTopics.join(', ')} aspects of recommendation systems\n`;
    }
    
    summary += "\nWould you like me to suggest a recommendation approach that might work best for you?";
    
    agent.add(summary);
    agent.add(new Suggestion('Yes, recommend approach'));
    agent.add(new Suggestion('No thanks'));
  }

  // Map intents to handlers
  let intentMap = new Map();
  
  // First, record all questions for analysis
  intentMap.set('Default Welcome Intent', recordQuestion);
  intentMap.set('CQ1_MainRecommendationEngines', recordQuestion);
  intentMap.set('CQ2_ContentBasedSimilarity', (agent) => {
    recordQuestion(agent);
    // After DialogFlow's response, ask for genre preferences
    askForGenrePreferences(agent);
    trackAndPrompt(agent, "Content-Based Filtering");
  });
  intentMap.set('CQ3_WeightedRatingCalculation', (agent) => {
    recordQuestion(agent);
    // After DialogFlow's response, ask about rating habits
    askAboutRatingHabits(agent);
    trackAndPrompt(agent, "Rating-Based Filtering");
  });
  intentMap.set('CQ4_ClusteringDiversification', (agent) => {
    recordQuestion(agent);
    trackAndPrompt(agent, "Clustering");
  });
  intentMap.set('CQ5_NLPFeaturesForContent', (agent) => {
    recordQuestion(agent);
    trackAndPrompt(agent, "NLP Features");
  });
  intentMap.set('CQ6_EvaluationMetrics', (agent) => {
    recordQuestion(agent);
    trackAndPrompt(agent, "Evaluation Metrics");
  });
  
  // Special intents for collecting information
  intentMap.set('Collect_Genre_Preference', collectGenrePreference);
  intentMap.set('Collect_Rating_Habits', collectRatingHabits);
  intentMap.set('Generate_Summary', generateSummary);
  
  agent.handleRequest(intentMap);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
