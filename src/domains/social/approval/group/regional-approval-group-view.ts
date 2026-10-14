import * as text from "../../../../kit/text.js";
import { RegionalApprovalGroup } from "./regional-approval-group.js";

/** How screens and exports show a regional approval group. */
export class RegionalApprovalGroupView {
  codeText: string;
  label: string;
  endsAt: string;
  titleText: string;
  segment: string;
  audienceId: string;
  conversionRateText: string;
  cost: string;
  discount: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    endsAt: string,
    titleText: string,
    segment: string,
    audienceId: string,
    conversionRateText: string,
    cost: string,
    discount: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.endsAt = endsAt;
    this.titleText = titleText;
    this.segment = segment;
    this.audienceId = audienceId;
    this.conversionRateText = conversionRateText;
    this.cost = cost;
    this.discount = discount;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalApprovalGroupView(item: RegionalApprovalGroup): RegionalApprovalGroupView {
  return new RegionalApprovalGroupView(
    item.code,
    item.label,
    String(item.endsAt),
    text.truncate(item.title, 80),
    item.segment,
    item.audienceId,
    item.conversionRate.toFixed(2),
    item.cost.toFixed(2),
    item.discount.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalApprovalGroupViews(items: RegionalApprovalGroup[]): RegionalApprovalGroupView[] {
  const views: RegionalApprovalGroupView[] = [];
  for (const item of items) {
    views.push(toRegionalApprovalGroupView(item));
  }
  return views;
}

export function sumRegionalApprovalGroupView(view: RegionalApprovalGroupView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedEndsAt + parsedConversionRate + parsedCost;
}
