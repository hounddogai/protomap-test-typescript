import * as text from "../../../../kit/text.js";
import { TicketViewPlan } from "./ticket-view-plan.js";

/** How screens and exports show a ticket view plan. */
export class TicketViewPlanView {
  code: string;
  name: string;
  region: string;
  approved: string;
  batchSize: string;
  sendAt: string;
  active: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    region: string,
    approved: string,
    batchSize: string,
    sendAt: string,
    active: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.approved = approved;
    this.batchSize = batchSize;
    this.sendAt = sendAt;
    this.active = active;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewPlanView(item: TicketViewPlan): TicketViewPlanView {
  return new TicketViewPlanView(
    item.code,
    text.truncate(item.name, 80),
    text.truncate(item.region, 80),
    `${item.approved}`,
    String(item.batchSize),
    String(item.sendAt),
    `${item.active}`,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewPlanViews(items: TicketViewPlan[]): TicketViewPlanView[] {
  const views: TicketViewPlanView[] = [];
  for (const item of items) {
    views.push(toTicketViewPlanView(item));
  }
  return views;
}

export function sumTicketViewPlanView(view: TicketViewPlanView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedBatchSize + parsedSendAt + parsedConversionRate;
}
