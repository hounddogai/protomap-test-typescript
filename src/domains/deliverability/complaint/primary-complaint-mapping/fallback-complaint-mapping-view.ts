import { FallbackComplaintMapping } from "./fallback-complaint-mapping.js";

/** How screens and exports show a fallback complaint mapping. */
export class FallbackComplaintMappingView {
  codeText: string;
  name: string;
  maximum: string;
  ratioText: string;
  score: string;
  pinned: string;
  graceDaysText: string;
  priority: string;
  endsAtText: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    maximum: string,
    ratioText: string,
    score: string,
    pinned: string,
    graceDaysText: string,
    priority: string,
    endsAtText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.maximum = maximum;
    this.ratioText = ratioText;
    this.score = score;
    this.pinned = pinned;
    this.graceDaysText = graceDaysText;
    this.priority = priority;
    this.endsAtText = endsAtText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackComplaintMappingView(item: FallbackComplaintMapping): FallbackComplaintMappingView {
  return new FallbackComplaintMappingView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    item.ratio.toFixed(2),
    item.score.toFixed(2),
    `${item.pinned}`,
    String(item.graceDays),
    String(item.priority),
    String(item.endsAt),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackComplaintMappingViews(items: FallbackComplaintMapping[]): FallbackComplaintMappingView[] {
  const views: FallbackComplaintMappingView[] = [];
  for (const item of items) {
    views.push(toFallbackComplaintMappingView(item));
  }
  return views;
}

export function sumFallbackComplaintMappingView(view: FallbackComplaintMappingView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedMaximum + parsedRatio + parsedScore;
}
