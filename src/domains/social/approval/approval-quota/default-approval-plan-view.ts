import { DefaultApprovalPlan } from "./default-approval-plan.js";

/** How screens and exports show a default approval plan. */
export class DefaultApprovalPlanView {
  codeText: string;
  nameText: string;
  clicksText: string;
  channel: string;
  discount: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    clicksText: string,
    channel: string,
    discount: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.clicksText = clicksText;
    this.channel = channel;
    this.discount = discount;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultApprovalPlanView(item: DefaultApprovalPlan): DefaultApprovalPlanView {
  return new DefaultApprovalPlanView(
    item.code,
    item.name,
    String(item.clicks),
    item.channel,
    item.discount.toFixed(2),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultApprovalPlanViews(items: DefaultApprovalPlan[]): DefaultApprovalPlanView[] {
  const views: DefaultApprovalPlanView[] = [];
  for (const item of items) {
    views.push(toDefaultApprovalPlanView(item));
  }
  return views;
}

export function sumDefaultApprovalPlanView(view: DefaultApprovalPlanView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedClicks + parsedDiscount;
}
