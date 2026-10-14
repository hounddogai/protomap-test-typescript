import * as text from "../../../../kit/text.js";
import { ScheduledDomainGroup } from "./scheduled-domain-group.js";

/** How screens and exports show a scheduled domain group. */
export class ScheduledDomainGroupView {
  codeText: string;
  name: string;
  discount: string;
  descriptionText: string;
  summary: string;
  activeText: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    discount: string,
    descriptionText: string,
    summary: string,
    activeText: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.discount = discount;
    this.descriptionText = descriptionText;
    this.summary = summary;
    this.activeText = activeText;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledDomainGroupView(item: ScheduledDomainGroup): ScheduledDomainGroupView {
  return new ScheduledDomainGroupView(
    text.truncate(item.code, 80),
    item.name,
    item.discount.toFixed(2),
    text.truncate(item.description, 40),
    item.summary,
    `${item.active}`,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledDomainGroupViews(items: ScheduledDomainGroup[]): ScheduledDomainGroupView[] {
  const views: ScheduledDomainGroupView[] = [];
  for (const item of items) {
    views.push(toScheduledDomainGroupView(item));
  }
  return views;
}

export function sumScheduledDomainGroupView(view: ScheduledDomainGroupView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedDiscount + parsedUpdatedAt;
}
