import * as text from "../../../../kit/text.js";
import { DefaultFraudCheckPlan } from "./default-fraud-check-plan.js";

/** How screens and exports show a default fraud check plan. */
export class DefaultFraudCheckPlanView {
  codeText: string;
  nameText: string;
  title: string;
  clicks: string;
  quantity: string;
  limitText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    title: string,
    clicks: string,
    quantity: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.title = title;
    this.clicks = clicks;
    this.quantity = quantity;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultFraudCheckPlanView(item: DefaultFraudCheckPlan): DefaultFraudCheckPlanView {
  return new DefaultFraudCheckPlanView(
    item.code,
    text.truncate(item.name, 40),
    text.truncate(item.title, 120),
    String(item.clicks),
    String(item.quantity),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultFraudCheckPlanViews(items: DefaultFraudCheckPlan[]): DefaultFraudCheckPlanView[] {
  const views: DefaultFraudCheckPlanView[] = [];
  for (const item of items) {
    views.push(toDefaultFraudCheckPlanView(item));
  }
  return views;
}

export function sumDefaultFraudCheckPlanView(view: DefaultFraudCheckPlanView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedClicks + parsedQuantity + parsedLimit;
}
