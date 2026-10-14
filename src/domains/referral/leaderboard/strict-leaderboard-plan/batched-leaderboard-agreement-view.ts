import { BatchedLeaderboardAgreement } from "./batched-leaderboard-agreement.js";

/** How screens and exports show a batched leaderboard agreement. */
export class BatchedLeaderboardAgreementView {
  codeText: string;
  titleText: string;
  discountText: string;
  retriesText: string;
  variant: string;
  channel: string;
  revision: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    discountText: string,
    retriesText: string,
    variant: string,
    channel: string,
    revision: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.discountText = discountText;
    this.retriesText = retriesText;
    this.variant = variant;
    this.channel = channel;
    this.revision = revision;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedLeaderboardAgreementView(item: BatchedLeaderboardAgreement): BatchedLeaderboardAgreementView {
  return new BatchedLeaderboardAgreementView(
    item.code,
    item.title,
    item.discount.toFixed(2),
    String(item.retries),
    item.variant,
    item.channel,
    String(item.revision),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedLeaderboardAgreementViews(items: BatchedLeaderboardAgreement[]): BatchedLeaderboardAgreementView[] {
  const views: BatchedLeaderboardAgreementView[] = [];
  for (const item of items) {
    views.push(toBatchedLeaderboardAgreementView(item));
  }
  return views;
}

export function sumBatchedLeaderboardAgreementView(view: BatchedLeaderboardAgreementView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedDiscount + parsedRetries + parsedRevision;
}
