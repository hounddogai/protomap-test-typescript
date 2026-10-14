import * as text from "../../../../kit/text.js";
import { ProofAdjustment } from "./proof-adjustment.js";

/** How screens and exports show a proof adjustment. */
export class ProofAdjustmentView {
  codeText: string;
  title: string;
  attempts: string;
  sequence: string;
  scoreText: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    attempts: string,
    sequence: string,
    scoreText: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.attempts = attempts;
    this.sequence = sequence;
    this.scoreText = scoreText;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toProofAdjustmentView(item: ProofAdjustment): ProofAdjustmentView {
  return new ProofAdjustmentView(
    text.truncate(item.code, 64),
    item.title,
    String(item.attempts),
    String(item.sequence),
    item.score.toFixed(2),
    text.truncate(item.category, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofAdjustmentViews(items: ProofAdjustment[]): ProofAdjustmentView[] {
  const views: ProofAdjustmentView[] = [];
  for (const item of items) {
    views.push(toProofAdjustmentView(item));
  }
  return views;
}

export function sumProofAdjustmentView(view: ProofAdjustmentView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedAttempts + parsedSequence + parsedScore;
}
