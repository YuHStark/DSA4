'use strict';

const express = require('express');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');

const app = express();

app.get('/', (req, res) => {
  res.send('Book Recommendation Webhook is running!');
});

app.post('/webhook', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(req.body));

  // Welcome handler
  function welcome(agent) {
    agent.add('Welcome to the Book Recommendation System! What would you like to know about?');
    agent.add(new Suggestion('Recommendation Engines'));
    agent.add(new Suggestion('Content-Based Filtering'));
    agent.add(new Suggestion('Rating Calculations'));
  }

  // Fallback handler
  function fallback(agent) {
    agent.add('I didn\'t understand that. Can you rephrase?');
  }

  // Main Recommendation Engines handler
  function handleMainRecommendationEngines(agent) {
    agent.add('The book recommender system uses three main types of recommendation engines: content-based filtering, rating-based filtering, and clustering-based recommendation.');
    
    // Add a follow-up question to collect more information
    agent.add('Would you like to know more about a specific recommendation method?');
    agent.add(new Suggestion('Content-based'));
    agent.add(new Suggestion('Rating-based'));
    agent.add(new Suggestion('Clustering-based'));
  }

  // Content-Based Filtering handler
  function handleContentBasedFiltering(agent) {
    agent.add('Content-based filtering identifies similar books by analyzing their features, such as descriptions, genres, or word embeddings.');
    
    // Collect user preference for follow-up information
    agent.add('Would you like to know more about the similarity metrics used?');
    agent.add(new Suggestion('Yes'));
    agent.add(new Suggestion('No'));
  }

  // User preference collection function
  function collectUserPreferences(agent) {
    // Get parameters from the intent
    const bookGenre = agent.parameters.genre;
    const ratingThreshold = agent.parameters.rating_threshold;
    
    // Store in contexts for later use
    agent.context.set({
      name: 'user_preferences',
      lifespan: 5,
      parameters: {
        genre: bookGenre,
        minRating: ratingThreshold
      }
    });
    
    agent.add(`Great! I'll remember that you're interested in ${bookGenre} books with ratings above ${ratingThreshold}.`);
    agent.add('What else would you like to know about the recommendation system?');
  }

  // Function that uses stored preferences
  function useStoredPreferences(agent) {
    // Retrieve the stored preferences
    const context = agent.context.get('user_preferences');
    
    if (context) {
      const genre = context.parameters.genre;
      const rating = context.parameters.minRating;
      
      agent.add(`Based on your interest in ${genre} books with ratings above ${rating}, I'd recommend using our content-based filtering approach.`);
    } else {
      agent.add('I don\'t have your preferences yet. Let me ask you some questions first.');
      // Redirect to preference collection
    }
  }

  // Map intents to handlers
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('CQ1_MainRecommendationEngines', handleMainRecommendationEngines);
  intentMap.set('CQ2_ContentBasedSimilarity', handleContentBasedFiltering);
  intentMap.set('CollectPreferences', collectUserPreferences);
  intentMap.set('UsePreferences', useStoredPreferences);
  // Add your other handlers here
  
  agent.handleRequest(intentMap);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
