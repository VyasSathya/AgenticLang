/**
 * Validate Confidence Claims Against Mutation Scores
 * Ensures that claimed confidence matches test robustness
 */

import { readFileSync, existsSync } from 'fs';
import { AgenticRuntime } from '../src/runtime';

interface MutationReport {
  mutationScore: number;
  files: Record<string, FileMutationResult>;
}

interface FileMutationResult {
  mutationScore: number;
  killed: number;
  survived: number;
  timeout: number;
  noCoverage: number;
}

async function validateConfidenceMutation() {
  // Load mutation testing report
  const reportPath = './reports/mutation/mutation.json';

  if (!existsSync(reportPath)) {
    console.log('⚠️  No mutation report found. Run: npm run test:mutation');
    process.exit(0);
  }

  const report: MutationReport = JSON.parse(readFileSync(reportPath, 'utf-8'));

  // Extract confidence scores from runtime
  // (In production, this would analyze the source code)
  const confidenceScores = new Map<string, number>();

  // Example: Manually map function names to confidence scores
  // This would be automated by parsing .agentic files
  confidenceScores.set('divide', 0.95);
  confidenceScores.set('authenticate', 0.90);
  confidenceScores.set('parseDate', 0.70);

  console.log('📊 Confidence vs Mutation Score Validation\n');
  console.log('─'.repeat(80));

  let mismatches = 0;
  let checks = 0;

  for (const [funcName, claimedConfidence] of confidenceScores.entries()) {
    // Find mutation score for this function
    const mutationScore = getMutationScoreForFunction(funcName, report);

    if (mutationScore === null) {
      console.log(`⚠️  ${funcName}: No mutation data (confidence: ${claimedConfidence})`);
      continue;
    }

    checks++;

    // Validate: mutation score should be >= claimed confidence
    // Rationale: If mutation score is 0.85, we can be at most 85% confident
    const threshold = 0.10; // Allow 10% tolerance
    const delta = mutationScore - claimedConfidence;

    if (delta < -threshold) {
      mismatches++;
      console.log(`❌ ${funcName}:`);
      console.log(`   Claimed confidence: ${claimedConfidence.toFixed(2)}`);
      console.log(`   Mutation score:     ${mutationScore.toFixed(2)}`);
      console.log(`   Gap:                ${Math.abs(delta).toFixed(2)} (overconfident!)`);
      console.log(`   Recommendation:     Lower confidence to ${mutationScore.toFixed(2)} or improve tests`);
    } else if (delta > 0.15) {
      console.log(`ℹ️  ${funcName}:`);
      console.log(`   Claimed confidence: ${claimedConfidence.toFixed(2)}`);
      console.log(`   Mutation score:     ${mutationScore.toFixed(2)}`);
      console.log(`   Gap:                ${delta.toFixed(2)} (conservative)`);
      console.log(`   Recommendation:     Can increase confidence to ${mutationScore.toFixed(2)}`);
    } else {
      console.log(`✓ ${funcName}: ${claimedConfidence.toFixed(2)} ≈ ${mutationScore.toFixed(2)} (aligned)`);
    }
  }

  console.log('─'.repeat(80));
  console.log(`\nSummary: ${checks - mismatches}/${checks} functions have aligned confidence scores`);

  if (mismatches > 0) {
    console.log(`\n⚠️  ${mismatches} functions are overconfident - review recommended`);
    process.exit(1);
  } else {
    console.log('\n✓ All confidence claims validated against mutation testing!');
  }
}

function getMutationScoreForFunction(
  funcName: string,
  report: MutationReport
): number | null {
  // Search through files for function mutation score
  for (const [fileName, fileResult] of Object.entries(report.files)) {
    if (fileName.includes(funcName) || fileName.includes(funcName.toLowerCase())) {
      return fileResult.mutationScore / 100; // Convert from percentage
    }
  }

  return null;
}

// Run validation
validateConfidenceMutation().catch(error => {
  console.error('Error validating confidence:', error);
  process.exit(1);
});
