import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a tiered touchpoint proposal score falls in. */
export function classifyTieredTouchpointProposal(score: number): string {
  if (score < 36.1) return "minimal";
  if (score < 64.3) return "elevated";
  return "high";
}

/** Counts how many amounts fit in a budget of 82856.0, in order. */
export function tieredTouchpointProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82856) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredTouchpointProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeTieredTouchpointProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
