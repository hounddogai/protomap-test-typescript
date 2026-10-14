import * as text from "../../../../kit/text.js";
import { RollingProofAllocation } from "./rolling-proof-allocation.js";

/** How screens and exports show a rolling proof allocation. */
export class RollingProofAllocationView {
  code: string;
  title: string;
  amount: string;
  phone: string;
  sourceText: string;
  weight: string;
  segment: string;
  checksum: string;
  priorityText: string;
  channel: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    amount: string,
    phone: string,
    sourceText: string,
    weight: string,
    segment: string,
    checksum: string,
    priorityText: string,
    channel: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.phone = phone;
    this.sourceText = sourceText;
    this.weight = weight;
    this.segment = segment;
    this.checksum = checksum;
    this.priorityText = priorityText;
    this.channel = channel;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toRollingProofAllocationView(item: RollingProofAllocation): RollingProofAllocationView {
  return new RollingProofAllocationView(
    item.code,
    item.title,
    item.amount.toFixed(2),
    item.phone,
    item.source,
    item.weight.toFixed(2),
    text.truncate(item.segment, 64),
    item.checksum,
    String(item.priority),
    item.channel,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingProofAllocationViews(items: RollingProofAllocation[]): RollingProofAllocationView[] {
  const views: RollingProofAllocationView[] = [];
  for (const item of items) {
    views.push(toRollingProofAllocationView(item));
  }
  return views;
}

export function sumRollingProofAllocationView(view: RollingProofAllocationView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedAmount + parsedWeight + parsedPriority;
}
