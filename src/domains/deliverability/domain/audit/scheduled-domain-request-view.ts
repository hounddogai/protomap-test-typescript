import * as text from "../../../../kit/text.js";
import { ScheduledDomainRequest } from "./scheduled-domain-request.js";

/** How screens and exports show a scheduled domain request. */
export class ScheduledDomainRequestView {
  code: string;
  name: string;
  source: string;
  visible: string;
  reviewer: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    source: string,
    visible: string,
    reviewer: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.visible = visible;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledDomainRequestView(item: ScheduledDomainRequest): ScheduledDomainRequestView {
  return new ScheduledDomainRequestView(
    text.truncate(item.code, 40),
    item.name,
    item.source,
    `${item.visible}`,
    text.truncate(item.reviewer, 40),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledDomainRequestViews(items: ScheduledDomainRequest[]): ScheduledDomainRequestView[] {
  const views: ScheduledDomainRequestView[] = [];
  for (const item of items) {
    views.push(toScheduledDomainRequestView(item));
  }
  return views;
}

export function sumScheduledDomainRequestView(view: ScheduledDomainRequestView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
