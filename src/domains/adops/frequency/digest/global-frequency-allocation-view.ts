import * as text from "../../../../kit/text.js";
import { GlobalFrequencyAllocation } from "./global-frequency-allocation.js";

/** How screens and exports show a global frequency allocation. */
export class GlobalFrequencyAllocationView {
  code: string;
  title: string;
  limitText: string;
  phoneText: string;
  summary: string;
  sourceText: string;
  currency: string;
  endsAt: string;
  updatedAt: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    limitText: string,
    phoneText: string,
    summary: string,
    sourceText: string,
    currency: string,
    endsAt: string,
    updatedAt: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.limitText = limitText;
    this.phoneText = phoneText;
    this.summary = summary;
    this.sourceText = sourceText;
    this.currency = currency;
    this.endsAt = endsAt;
    this.updatedAt = updatedAt;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFrequencyAllocationView(item: GlobalFrequencyAllocation): GlobalFrequencyAllocationView {
  return new GlobalFrequencyAllocationView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 80),
    String(item.limit),
    text.truncate(item.phone, 40),
    text.truncate(item.summary, 120),
    item.source,
    text.truncate(item.currency, 40),
    String(item.endsAt),
    String(item.updatedAt),
    text.truncate(item.journeyId, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFrequencyAllocationViews(items: GlobalFrequencyAllocation[]): GlobalFrequencyAllocationView[] {
  const views: GlobalFrequencyAllocationView[] = [];
  for (const item of items) {
    views.push(toGlobalFrequencyAllocationView(item));
  }
  return views;
}

export function sumGlobalFrequencyAllocationView(view: GlobalFrequencyAllocationView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedLimit + parsedEndsAt + parsedUpdatedAt;
}
