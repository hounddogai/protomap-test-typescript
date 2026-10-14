import * as text from "../../../../kit/text.js";
import { WaitTemplate } from "./wait-template.js";

/** How screens and exports show a wait template. */
export class WaitTemplateView {
  code: string;
  title: string;
  costText: string;
  active: string;
  name: string;
  sourceText: string;
  checksum: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    costText: string,
    active: string,
    name: string,
    sourceText: string,
    checksum: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.costText = costText;
    this.active = active;
    this.name = name;
    this.sourceText = sourceText;
    this.checksum = checksum;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toWaitTemplateView(item: WaitTemplate): WaitTemplateView {
  return new WaitTemplateView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    `${item.active}`,
    item.name,
    item.source,
    text.truncate(item.checksum, 80),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitTemplateViews(items: WaitTemplate[]): WaitTemplateView[] {
  const views: WaitTemplateView[] = [];
  for (const item of items) {
    views.push(toWaitTemplateView(item));
  }
  return views;
}

export function sumWaitTemplateView(view: WaitTemplateView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedCost;
}
