import { PrimaryWaitMilestone } from "./primary-wait-milestone.js";

/** How screens and exports show a primary wait milestone. */
export class PrimaryWaitMilestoneView {
  codeText: string;
  name: string;
  variantText: string;
  archivedText: string;
  country: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    variantText: string,
    archivedText: string,
    country: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.variantText = variantText;
    this.archivedText = archivedText;
    this.country = country;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryWaitMilestoneView(item: PrimaryWaitMilestone): PrimaryWaitMilestoneView {
  return new PrimaryWaitMilestoneView(
    item.code,
    item.name,
    item.variant,
    `${item.archived}`,
    item.country,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryWaitMilestoneViews(items: PrimaryWaitMilestone[]): PrimaryWaitMilestoneView[] {
  const views: PrimaryWaitMilestoneView[] = [];
  for (const item of items) {
    views.push(toPrimaryWaitMilestoneView(item));
  }
  return views;
}

export function sumPrimaryWaitMilestoneView(view: PrimaryWaitMilestoneView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
