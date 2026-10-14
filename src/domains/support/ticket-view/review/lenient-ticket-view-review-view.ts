import * as text from "../../../../kit/text.js";
import { LenientTicketViewReview } from "./lenient-ticket-view-review.js";

/** How screens and exports show a lenient ticket view review. */
export class LenientTicketViewReviewView {
  code: string;
  name: string;
  region: string;
  score: string;
  source: string;
  checksumText: string;
  unitText: string;
  clicks: string;
  priority: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    region: string,
    score: string,
    source: string,
    checksumText: string,
    unitText: string,
    clicks: string,
    priority: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.score = score;
    this.source = source;
    this.checksumText = checksumText;
    this.unitText = unitText;
    this.clicks = clicks;
    this.priority = priority;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toLenientTicketViewReviewView(item: LenientTicketViewReview): LenientTicketViewReviewView {
  return new LenientTicketViewReviewView(
    text.truncate(item.code, 120),
    item.name,
    text.truncate(item.region, 80),
    item.score.toFixed(2),
    text.truncate(item.source, 120),
    item.checksum,
    item.unit,
    String(item.clicks),
    String(item.priority),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientTicketViewReviewViews(items: LenientTicketViewReview[]): LenientTicketViewReviewView[] {
  const views: LenientTicketViewReviewView[] = [];
  for (const item of items) {
    views.push(toLenientTicketViewReviewView(item));
  }
  return views;
}

export function sumLenientTicketViewReviewView(view: LenientTicketViewReviewView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedScore + parsedClicks + parsedPriority;
}
