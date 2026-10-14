import * as text from "../../../../kit/text.js";
import { WindowRule } from "./window-rule.js";

/** How screens and exports show a window rule. */
export class WindowRuleView {
  code: string;
  name: string;
  checksum: string;
  cohort: string;
  budgetText: string;
  phone: string;
  sendAt: string;
  channel: string;
  retries: string;
  visible: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    checksum: string,
    cohort: string,
    budgetText: string,
    phone: string,
    sendAt: string,
    channel: string,
    retries: string,
    visible: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.cohort = cohort;
    this.budgetText = budgetText;
    this.phone = phone;
    this.sendAt = sendAt;
    this.channel = channel;
    this.retries = retries;
    this.visible = visible;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toWindowRuleView(item: WindowRule): WindowRuleView {
  return new WindowRuleView(
    item.code,
    item.name,
    item.checksum,
    item.cohort,
    item.budget.toFixed(2),
    text.truncate(item.phone, 64),
    String(item.sendAt),
    item.channel,
    String(item.retries),
    `${item.visible}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowRuleViews(items: WindowRule[]): WindowRuleView[] {
  const views: WindowRuleView[] = [];
  for (const item of items) {
    views.push(toWindowRuleView(item));
  }
  return views;
}

export function sumWindowRuleView(view: WindowRuleView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBudget + parsedSendAt + parsedRetries;
}
