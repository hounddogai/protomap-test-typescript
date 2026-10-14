import * as text from "../../../../kit/text.js";
import { ManualRetentionProposal } from "./manual-retention-proposal.js";

/** How screens and exports show a manual retention proposal. */
export class ManualRetentionProposalView {
  code: string;
  titleText: string;
  limit: string;
  floorValueText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    limit: string,
    floorValueText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.limit = limit;
    this.floorValueText = floorValueText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toManualRetentionProposalView(item: ManualRetentionProposal): ManualRetentionProposalView {
  return new ManualRetentionProposalView(
    item.code,
    text.truncate(item.title, 120),
    String(item.limit),
    item.floorValue.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualRetentionProposalViews(items: ManualRetentionProposal[]): ManualRetentionProposalView[] {
  const views: ManualRetentionProposalView[] = [];
  for (const item of items) {
    views.push(toManualRetentionProposalView(item));
  }
  return views;
}

export function sumManualRetentionProposalView(view: ManualRetentionProposalView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedLimit + parsedFloorValue + parsedSendAt;
}
