import { PendingRedemptionPolicy } from "./pending-redemption-policy.js";

/** How screens and exports show a pending redemption policy. */
export class PendingRedemptionPolicyView {
  codeText: string;
  titleText: string;
  revisionText: string;
  score: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    revisionText: string,
    score: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.revisionText = revisionText;
    this.score = score;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRedemptionPolicyView(item: PendingRedemptionPolicy): PendingRedemptionPolicyView {
  return new PendingRedemptionPolicyView(
    item.code,
    item.title,
    String(item.revision),
    item.score.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRedemptionPolicyViews(items: PendingRedemptionPolicy[]): PendingRedemptionPolicyView[] {
  const views: PendingRedemptionPolicyView[] = [];
  for (const item of items) {
    views.push(toPendingRedemptionPolicyView(item));
  }
  return views;
}

export function sumPendingRedemptionPolicyView(view: PendingRedemptionPolicyView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedRevision + parsedScore + parsedBatchSize;
}
