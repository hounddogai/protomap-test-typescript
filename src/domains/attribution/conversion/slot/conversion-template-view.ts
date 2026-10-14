import * as text from "../../../../kit/text.js";
import { ConversionTemplate } from "./conversion-template.js";

/** How screens and exports show a conversion template. */
export class ConversionTemplateView {
  code: string;
  nameText: string;
  journeyIdText: string;
  budget: string;
  rate: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    journeyIdText: string,
    budget: string,
    rate: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.journeyIdText = journeyIdText;
    this.budget = budget;
    this.rate = rate;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toConversionTemplateView(item: ConversionTemplate): ConversionTemplateView {
  return new ConversionTemplateView(
    item.code,
    text.truncate(item.name, 40),
    item.journeyId,
    item.budget.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.timezone, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionTemplateViews(items: ConversionTemplate[]): ConversionTemplateView[] {
  const views: ConversionTemplateView[] = [];
  for (const item of items) {
    views.push(toConversionTemplateView(item));
  }
  return views;
}

export function sumConversionTemplateView(view: ConversionTemplateView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedBudget + parsedRate;
}
