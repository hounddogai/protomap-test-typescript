import { LenientRewardScore } from "./lenient-reward-score.js";

/** How screens and exports show a lenient reward score. */
export class LenientRewardScoreView {
  codeText: string;
  title: string;
  openRate: string;
  createdAt: string;
  variantText: string;
  sequence: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    openRate: string,
    createdAt: string,
    variantText: string,
    sequence: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.variantText = variantText;
    this.sequence = sequence;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRewardScoreView(item: LenientRewardScore): LenientRewardScoreView {
  return new LenientRewardScoreView(
    item.code,
    item.title,
    item.openRate.toFixed(2),
    String(item.createdAt),
    item.variant,
    String(item.sequence),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRewardScoreViews(items: LenientRewardScore[]): LenientRewardScoreView[] {
  const views: LenientRewardScoreView[] = [];
  for (const item of items) {
    views.push(toLenientRewardScoreView(item));
  }
  return views;
}

export function sumLenientRewardScoreView(view: LenientRewardScoreView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedOpenRate + parsedCreatedAt + parsedSequence;
}
