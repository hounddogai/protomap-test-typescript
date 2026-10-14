import * as text from "../../../../kit/text.js";
import { SenderPolicy } from "./sender-policy.js";

/** How screens and exports show a sender policy. */
export class SenderPolicyView {
  code: string;
  label: string;
  revision: string;
  quantity: string;
  journeyId: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    quantity: string,
    journeyId: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.quantity = quantity;
    this.journeyId = journeyId;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toSenderPolicyView(item: SenderPolicy): SenderPolicyView {
  return new SenderPolicyView(
    item.code,
    text.truncate(item.label, 40),
    String(item.revision),
    String(item.quantity),
    text.truncate(item.journeyId, 120),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderPolicyViews(items: SenderPolicy[]): SenderPolicyView[] {
  const views: SenderPolicyView[] = [];
  for (const item of items) {
    views.push(toSenderPolicyView(item));
  }
  return views;
}

export function sumSenderPolicyView(view: SenderPolicyView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedRevision + parsedQuantity;
}
