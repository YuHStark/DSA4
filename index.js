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

  // This function will add the same follow-up to all responses
  function addFollowUpToResponse(agent) {
    // Set a context to track that we've asked the follow-up question
    agent.context.set({
      name: 'awaiting_more_questions',
      lifespan: 1
    });
    
    // Add the follow-up question
    agent.add('Is there anything else you\'d like to know about book recommendation systems?');
    agent.add(new Suggestion('Yes'));
    agent.add(new Suggestion('No'));
  }

  // Handler for the "No" response to our follow-up question
  function handleNoMoreQuestions(agent) {
    agent.add('Thank you for chatting! I hope you found the information helpful.');
  }

  // Map intents to handlers
  let intentMap = new Map();
  
  // For each intent that should have the follow-up question
  intentMap.set('CQ1_MainRecommendationEngines', addFollowUpToResponse);
  intentMap.set('CQ2_ContentBasedSimilarity', addFollowUpToResponse);
  intentMap.set('CQ3_WeightedRatingCalculation', addFollowUpToResponse);
  intentMap.set('CQ4_ClusteringDiversification', addFollowUpToResponse);
  intentMap.set('CQ5_NLPFeaturesForContent', addFollowUpToResponse);
  intentMap.set('CQ6_EvaluationMetrics', addFollowUpToResponse);
  
  // Add the handler for "no more questions"
  intentMap.set('No_More_Questions', handleNoMoreQuestions);
  
  agent.handleRequest(intentMap);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
