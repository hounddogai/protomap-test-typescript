import * as text from "../../../../kit/text.js";
import { TieredInviteRecord } from "./tiered-invite-record.js";

/** How screens and exports show a tiered invite record. */
export class TieredInviteRecordView {
  code: string;
  label: string;
  endsAt: string;
  ceiling: string;
  region: string;
  campaignRef: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    endsAt: string,
    ceiling: string,
    region: string,
    campaignRef: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.ceiling = ceiling;
    this.region = region;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toTieredInviteRecordView(item: TieredInviteRecord): TieredInviteRecordView {
  return new TieredInviteRecordView(
    text.truncate(item.code, 64),
    item.label,
    String(item.endsAt),
    item.ceiling.toFixed(2),
    item.region,
    item.campaignRef,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredInviteRecordViews(items: TieredInviteRecord[]): TieredInviteRecordView[] {
  const views: TieredInviteRecordView[] = [];
  for (const item of items) {
    views.push(toTieredInviteRecordView(item));
  }
  return views;
}

export function sumTieredInviteRecordView(view: TieredInviteRecordView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedEndsAt + parsedCeiling + parsedBudget;
}
