import { LenientQueuePolicy } from "./lenient-queue-policy.js";

/** How screens and exports show a lenient queue policy. */
export class LenientQueuePolicyView {
  codeText: string;
  nameText: string;
  endsAt: string;
  priorityText: string;
  cost: string;
  sendAt: string;
  windowDays: string;
  conversionRateText: string;
  marginText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    endsAt: string,
    priorityText: string,
    cost: string,
    sendAt: string,
    windowDays: string,
    conversionRateText: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.endsAt = endsAt;
    this.priorityText = priorityText;
    this.cost = cost;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.conversionRateText = conversionRateText;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientQueuePolicyView(item: LenientQueuePolicy): LenientQueuePolicyView {
  return new LenientQueuePolicyView(
    item.code,
    item.name,
    String(item.endsAt),
    String(item.priority),
    item.cost.toFixed(2),
    String(item.sendAt),
    String(item.windowDays),
    item.conversionRate.toFixed(2),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientQueuePolicyViews(items: LenientQueuePolicy[]): LenientQueuePolicyView[] {
  const views: LenientQueuePolicyView[] = [];
  for (const item of items) {
    views.push(toLenientQueuePolicyView(item));
  }
  return views;
}

export function sumLenientQueuePolicyView(view: LenientQueuePolicyView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedEndsAt + parsedPriority + parsedCost;
}
