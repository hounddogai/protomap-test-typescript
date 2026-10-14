import * as text from "../../../../kit/text.js";
import { AdaptiveModelTemplate } from "./adaptive-model-template.js";

/** How screens and exports show a adaptive model template. */
export class AdaptiveModelTemplateView {
  codeText: string;
  label: string;
  nameText: string;
  graceDays: string;
  createdAt: string;
  pinnedText: string;
  capacityText: string;
  cohort: string;
  activeText: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    nameText: string,
    graceDays: string,
    createdAt: string,
    pinnedText: string,
    capacityText: string,
    cohort: string,
    activeText: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.nameText = nameText;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
    this.pinnedText = pinnedText;
    this.capacityText = capacityText;
    this.cohort = cohort;
    this.activeText = activeText;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveModelTemplateView(item: AdaptiveModelTemplate): AdaptiveModelTemplateView {
  return new AdaptiveModelTemplateView(
    item.code,
    item.label,
    item.name,
    String(item.graceDays),
    String(item.createdAt),
    `${item.pinned}`,
    String(item.capacity),
    text.truncate(item.cohort, 120),
    `${item.active}`,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveModelTemplateViews(items: AdaptiveModelTemplate[]): AdaptiveModelTemplateView[] {
  const views: AdaptiveModelTemplateView[] = [];
  for (const item of items) {
    views.push(toAdaptiveModelTemplateView(item));
  }
  return views;
}

export function sumAdaptiveModelTemplateView(view: AdaptiveModelTemplateView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedGraceDays + parsedCreatedAt + parsedCapacity;
}
