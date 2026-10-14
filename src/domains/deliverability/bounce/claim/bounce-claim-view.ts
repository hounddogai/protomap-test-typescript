import * as text from "../../../../kit/text.js";
import { BounceClaim } from "./bounce-claim.js";

/** How screens and exports show a bounce claim. */
export class BounceClaimView {
  code: string;
  title: string;
  unitText: string;
  regionText: string;
  summary: string;
  revision: string;
  notes: string;
  score: string;
  budgetText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    unitText: string,
    regionText: string,
    summary: string,
    revision: string,
    notes: string,
    score: string,
    budgetText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.unitText = unitText;
    this.regionText = regionText;
    this.summary = summary;
    this.revision = revision;
    this.notes = notes;
    this.score = score;
    this.budgetText = budgetText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toBounceClaimView(item: BounceClaim): BounceClaimView {
  return new BounceClaimView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    item.unit,
    item.region,
    text.truncate(item.summary, 64),
    String(item.revision),
    text.truncate(item.notes, 120),
    item.score.toFixed(2),
    item.budget.toFixed(2),
    text.truncate(item.channel, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceClaimViews(items: BounceClaim[]): BounceClaimView[] {
  const views: BounceClaimView[] = [];
  for (const item of items) {
    views.push(toBounceClaimView(item));
  }
  return views;
}

export function sumBounceClaimView(view: BounceClaimView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedRevision + parsedScore + parsedBudget;
}
