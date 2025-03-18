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
    agent.add('Is there anything else you\'d like to know about book recommendation systems?');
  }

  // Content-Based Filtering handler
  function handleContentBasedFiltering(agent) {
    agent.add('Content-based filtering identifies similar books by analyzing their features, such as descriptions, genres, or word embeddings.');
    agent.add('Is there anything else you\'d like to know about book recommendation systems?');
  }
  
  function handleSimilarityMetrics(agent) {
  agent.context.set('discussing_similarity', 5);
  agent.add('Content-based filtering uses similarity metrics like cosine similarity and Jaccard similarity to compare books.');
  agent.add('Cosine similarity measures the angle between book feature vectors, while Jaccard similarity compares the overlap of features.');
  agent.add('Is there anything else you\'d like to know about book recommendation systems?');
}


// Rating-based filtering handler
function handleWeightedRatingCalculation(agent) {
  agent.add('Rating-based filtering computes a weighted rating using both the book\'s average rating and the number of reviews it has received.');
  agent.add('The formula is: WeightedRating = (average_rating × rating_count) / (rating_count + 10)');
  agent.add('Is there anything else you\'d like to know about book recommendation systems?');
}

// Clustering handler
function handleClusteringDiversification(agent) {
  agent.add('Clustering-based recommendation groups similar books using algorithms like K-Mean, Hierarchical clustering, and Gaussian Mixture Model (GMM).');
  agent.add('This helps readers explore a wider range of titles by suggesting books from different but related clusters.');
  agent.add('Is there anything else you\'d like to know about book recommendation systems?');
}

// NLP Features handler
function handleNLPFeatures(agent) {
  agent.add('NLP techniques improve content-based recommendations by converting book descriptions into structured representations, such as TF-IDF vectors or word embeddings.');
  agent.add('Is there anything else you\'d like to know about book recommendation systems?');
}

// Evaluation metrics handler
function handleEvaluationMetrics(agent) {
  agent.add('Book recommendation systems are evaluated using metrics like Precision & Recall, F1 Score, Mean Average Precision (MAP), and Mean Reciprocal Rank (MRR).');
  agent.add('Is there anything else you\'d like to know about book recommendation systems?');
}



  // Map intents to handlers
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('CQ1_MainRecommendationEngines', handleMainRecommendationEngines);
  intentMap.set('CQ2_ContentBasedSimilarity', handleContentBasedFiltering);
  intentMap.set('CQ3_WeightedRatingCalculation', handleWeightedRatingCalculation);
  intentMap.set('CQ4_ClusteringDiversification', handleClusteringDiversification);
  intentMap.set('CQ5_NLPFeaturesForContent', handleNLPFeatures);
  intentMap.set('CQ6_EvaluationMetrics', handleEvaluationMetrics);
  
  agent.handleRequest(intentMap);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
