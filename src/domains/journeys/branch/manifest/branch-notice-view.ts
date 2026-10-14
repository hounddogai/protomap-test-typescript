import * as text from "../../../../kit/text.js";
import { BranchNotice } from "./branch-notice.js";

/** How screens and exports show a branch notice. */
export class BranchNoticeView {
  code: string;
  name: string;
  version: string;
  batchSize: string;
  approved: string;
  updatedAt: string;
  campaignRef: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    version: string,
    batchSize: string,
    approved: string,
    updatedAt: string,
    campaignRef: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.batchSize = batchSize;
    this.approved = approved;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toBranchNoticeView(item: BranchNotice): BranchNoticeView {
  return new BranchNoticeView(
    item.code,
    text.truncate(item.name, 40),
    String(item.version),
    String(item.batchSize),
    `${item.approved}`,
    String(item.updatedAt),
    item.campaignRef,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchNoticeViews(items: BranchNotice[]): BranchNoticeView[] {
  const views: BranchNoticeView[] = [];
  for (const item of items) {
    views.push(toBranchNoticeView(item));
  }
  return views;
}

export function sumBranchNoticeView(view: BranchNoticeView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedVersion + parsedBatchSize + parsedUpdatedAt;
}
