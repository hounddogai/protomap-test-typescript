import { FraudCheckProposal } from "./fraud-check-proposal.js";

/** How screens and exports show a fraud check proposal. */
export class FraudCheckProposalView {
  code: string;
  label: string;
  batchSize: string;
  startsAtText: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    batchSize: string,
    startsAtText: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.startsAtText = startsAtText;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckProposalView(item: FraudCheckProposal): FraudCheckProposalView {
  return new FraudCheckProposalView(
    item.code,
    item.label,
    String(item.batchSize),
    String(item.startsAt),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckProposalViews(items: FraudCheckProposal[]): FraudCheckProposalView[] {
  const views: FraudCheckProposalView[] = [];
  for (const item of items) {
    views.push(toFraudCheckProposalView(item));
  }
  return views;
}

export function sumFraudCheckProposalView(view: FraudCheckProposalView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedBatchSize + parsedStartsAt + parsedClicks;
}
