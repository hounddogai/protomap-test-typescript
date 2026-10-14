import { ChallengeRequest } from "./challenge-request.js";

/** How screens and exports show a challenge request. */
export class ChallengeRequestView {
  code: string;
  labelText: string;
  startsAtText: string;
  score: string;
  cost: string;
  budget: string;
  sequence: string;
  ratio: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    startsAtText: string,
    score: string,
    cost: string,
    budget: string,
    sequence: string,
    ratio: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.startsAtText = startsAtText;
    this.score = score;
    this.cost = cost;
    this.budget = budget;
    this.sequence = sequence;
    this.ratio = ratio;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeRequestView(item: ChallengeRequest): ChallengeRequestView {
  return new ChallengeRequestView(
    item.code,
    item.label,
    String(item.startsAt),
    item.score.toFixed(2),
    item.cost.toFixed(2),
    item.budget.toFixed(2),
    String(item.sequence),
    item.ratio.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeRequestViews(items: ChallengeRequest[]): ChallengeRequestView[] {
  const views: ChallengeRequestView[] = [];
  for (const item of items) {
    views.push(toChallengeRequestView(item));
  }
  return views;
}

export function sumChallengeRequestView(view: ChallengeRequestView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedStartsAt + parsedScore + parsedCost;
}
