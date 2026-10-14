import * as text from "../../../../kit/text.js";
import { BatchedBranchNotice } from "./batched-branch-notice.js";

/** How screens and exports show a batched branch notice. */
export class BatchedBranchNoticeView {
  codeText: string;
  title: string;
  phoneText: string;
  approved: string;
  sequenceText: string;
  channel: string;
  label: string;
  windowDays: string;
  clicks: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    phoneText: string,
    approved: string,
    sequenceText: string,
    channel: string,
    label: string,
    windowDays: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.phoneText = phoneText;
    this.approved = approved;
    this.sequenceText = sequenceText;
    this.channel = channel;
    this.label = label;
    this.windowDays = windowDays;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedBranchNoticeView(item: BatchedBranchNotice): BatchedBranchNoticeView {
  return new BatchedBranchNoticeView(
    item.code,
    item.title,
    text.truncate(item.phone, 40),
    `${item.approved}`,
    String(item.sequence),
    item.channel,
    item.label,
    String(item.windowDays),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedBranchNoticeViews(items: BatchedBranchNotice[]): BatchedBranchNoticeView[] {
  const views: BatchedBranchNoticeView[] = [];
  for (const item of items) {
    views.push(toBatchedBranchNoticeView(item));
  }
  return views;
}

export function sumBatchedBranchNoticeView(view: BatchedBranchNoticeView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedSequence + parsedWindowDays + parsedClicks;
}
