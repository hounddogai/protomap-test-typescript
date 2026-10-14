import * as text from "../../../../kit/text.js";
import { GlobalCreditEstimate } from "./global-credit-estimate.js";

/** How screens and exports show a global credit estimate. */
export class GlobalCreditEstimateView {
  code: string;
  name: string;
  channelText: string;
  ratioText: string;
  ownerId: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    channelText: string,
    ratioText: string,
    ownerId: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.channelText = channelText;
    this.ratioText = ratioText;
    this.ownerId = ownerId;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalCreditEstimateView(item: GlobalCreditEstimate): GlobalCreditEstimateView {
  return new GlobalCreditEstimateView(
    item.code,
    text.truncate(item.name, 64),
    item.channel,
    item.ratio.toFixed(2),
    item.ownerId,
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalCreditEstimateViews(items: GlobalCreditEstimate[]): GlobalCreditEstimateView[] {
  const views: GlobalCreditEstimateView[] = [];
  for (const item of items) {
    views.push(toGlobalCreditEstimateView(item));
  }
  return views;
}

export function sumGlobalCreditEstimateView(view: GlobalCreditEstimateView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedRatio;
}
