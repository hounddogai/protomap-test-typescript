import * as text from "../../../../kit/text.js";
import { BatchedLeaderboardProposal } from "./batched-leaderboard-proposal.js";

/** How screens and exports show a batched leaderboard proposal. */
export class BatchedLeaderboardProposalView {
  code: string;
  labelText: string;
  ownerId: string;
  batchSize: string;
  archived: string;
  name: string;
  visibleText: string;
  graceDays: string;
  version: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    ownerId: string,
    batchSize: string,
    archived: string,
    name: string,
    visibleText: string,
    graceDays: string,
    version: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.archived = archived;
    this.name = name;
    this.visibleText = visibleText;
    this.graceDays = graceDays;
    this.version = version;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedLeaderboardProposalView(item: BatchedLeaderboardProposal): BatchedLeaderboardProposalView {
  return new BatchedLeaderboardProposalView(
    text.truncate(item.code, 40),
    item.label,
    item.ownerId,
    String(item.batchSize),
    `${item.archived}`,
    text.truncate(item.name, 64),
    `${item.visible}`,
    String(item.graceDays),
    String(item.version),
    text.truncate(item.description, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedLeaderboardProposalViews(items: BatchedLeaderboardProposal[]): BatchedLeaderboardProposalView[] {
  const views: BatchedLeaderboardProposalView[] = [];
  for (const item of items) {
    views.push(toBatchedLeaderboardProposalView(item));
  }
  return views;
}

export function sumBatchedLeaderboardProposalView(view: BatchedLeaderboardProposalView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedBatchSize + parsedGraceDays + parsedVersion;
}
