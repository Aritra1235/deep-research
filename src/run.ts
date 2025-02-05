import * as fs from 'fs/promises';
import * as readline from 'readline';

import { deepResearch, writeFinalReport } from './deep-research';
import { generateFeedback } from './feedback';
import { o3MiniModel, gpt4Model, gpt4MiniModel, g_15pro} from './ai/providers';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to get user input
function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

type ModelType = typeof MODEL_OPTIONS[keyof typeof MODEL_OPTIONS];


const MODEL_OPTIONS = {
  'GPT-4': gpt4Model,
  'GPT-4 Mini': gpt4MiniModel,
  'O3 Mini': o3MiniModel,
  'Gemini 1.5 Pro': g_15pro
} as const;

// run the agent
async function run() {
  // Add model selection
  console.log('\nAvailable models:');
  Object.entries(MODEL_OPTIONS).forEach(([name, _], index) => {
    console.log(`${index + 1}. ${name}`);
  });

  const modelChoice = parseInt(
    await askQuestion('\nSelect model number (default 1): '),
    10
  ) || 1;

  console.log(modelChoice)

  const selectedModel = Object.values(MODEL_OPTIONS)[modelChoice - 1] ?? o3MiniModel;

  console.log(selectedModel)
  // Get initial query
  const initialQuery = await askQuestion('What would you like to research? ');

  // Get breath and depth parameters
  const breadth =
    parseInt(
      await askQuestion(
        'Enter research breadth (recommended 2-10, default 4): ',
      ),
      10,
    ) || 4;
  const depth =
    parseInt(
      await askQuestion('Enter research depth (recommended 1-5, default 2): '),
      10,
    ) || 2;

  console.log(`Creating research plan...`);

  // Generate follow-up questions
  const followUpQuestions = await generateFeedback({
    query: initialQuery,
    model: selectedModel ,
  });

  console.log(
    '\nTo better understand your research needs, please answer these follow-up questions:',
  );

  // Collect answers to follow-up questions
  const answers: string[] = [];
  for (const question of followUpQuestions) {
    const answer = await askQuestion(`\n${question}\nYour answer: `);
    answers.push(answer);
  }

  // Combine all information for deep research
  const combinedQuery = `
Initial Query: ${initialQuery}
Follow-up Questions and Answers:
${followUpQuestions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
`;

  console.log('\nResearching your topic...');

  const { learnings, visitedUrls } = await deepResearch({
    query: combinedQuery,
    model: selectedModel,
    breadth,
    depth,
  });

  console.log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
  console.log(
    `\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`,
  );
  console.log('Writing final report...');

  const report = await writeFinalReport({
    prompt: combinedQuery,
    model: selectedModel,
    learnings,
    visitedUrls,
  });

  // Save report to file
  await fs.writeFile('report.md', report, 'utf-8');

  console.log(`\n\nFinal Report:\n\n${report}`);
  console.log('\nReport has been saved to report.md');
  rl.close();
}

run().catch(console.error);
