import * as text from "../../../../kit/text.js";
import { GlobalModelTier } from "./global-model-tier.js";

/** How screens and exports show a global model tier. */
export class GlobalModelTierView {
  code: string;
  name: string;
  contactEmail: string;
  unitText: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    unitText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.unitText = unitText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalModelTierView(item: GlobalModelTier): GlobalModelTierView {
  return new GlobalModelTierView(
    text.truncate(item.code, 120),
    item.name,
    item.contactEmail,
    item.unit,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalModelTierViews(items: GlobalModelTier[]): GlobalModelTierView[] {
  const views: GlobalModelTierView[] = [];
  for (const item of items) {
    views.push(toGlobalModelTierView(item));
  }
  return views;
}

export function sumGlobalModelTierView(view: GlobalModelTierView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
