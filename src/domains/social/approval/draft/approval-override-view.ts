import * as text from "../../../../kit/text.js";
import { ApprovalOverride } from "./approval-override.js";

/** How screens and exports show a approval override. */
export class ApprovalOverrideView {
  code: string;
  title: string;
  weight: string;
  sendAt: string;
  batchSize: string;
  statusLabel: string;

  constructor(code: string, title: string, weight: string, sendAt: string, batchSize: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalOverrideView(item: ApprovalOverride): ApprovalOverrideView {
  return new ApprovalOverrideView(
    item.code,
    text.truncate(item.title, 40),
    item.weight.toFixed(2),
    String(item.sendAt),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalOverrideViews(items: ApprovalOverride[]): ApprovalOverrideView[] {
  const views: ApprovalOverrideView[] = [];
  for (const item of items) {
    views.push(toApprovalOverrideView(item));
  }
  return views;
}

export function sumApprovalOverrideView(view: ApprovalOverrideView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedWeight + parsedSendAt + parsedBatchSize;
}
