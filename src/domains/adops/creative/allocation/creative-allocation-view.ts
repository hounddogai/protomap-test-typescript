import * as text from "../../../../kit/text.js";
import { CreativeAllocation } from "./creative-allocation.js";

/** How screens and exports show a creative allocation. */
export class CreativeAllocationView {
  codeText: string;
  name: string;
  category: string;
  label: string;
  cohort: string;
  journeyId: string;
  externalRef: string;
  expiresAtText: string;
  windowDays: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    category: string,
    label: string,
    cohort: string,
    journeyId: string,
    externalRef: string,
    expiresAtText: string,
    windowDays: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.category = category;
    this.label = label;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.externalRef = externalRef;
    this.expiresAtText = expiresAtText;
    this.windowDays = windowDays;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeAllocationView(item: CreativeAllocation): CreativeAllocationView {
  return new CreativeAllocationView(
    item.code,
    item.name,
    text.truncate(item.category, 80),
    item.label,
    item.cohort,
    item.journeyId,
    item.externalRef,
    String(item.expiresAt),
    String(item.windowDays),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeAllocationViews(items: CreativeAllocation[]): CreativeAllocationView[] {
  const views: CreativeAllocationView[] = [];
  for (const item of items) {
    views.push(toCreativeAllocationView(item));
  }
  return views;
}

export function sumCreativeAllocationView(view: CreativeAllocationView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedExpiresAt + parsedWindowDays + parsedMargin;
}
