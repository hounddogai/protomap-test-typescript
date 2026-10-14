import { LenientLevelProposal } from "./lenient-level-proposal.js";

/** How screens and exports show a lenient level proposal. */
export class LenientLevelProposalView {
  code: string;
  labelText: string;
  discountText: string;
  startsAt: string;
  windowDaysText: string;
  ceiling: string;
  visible: string;
  description: string;
  expiresAt: string;
  phoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    discountText: string,
    startsAt: string,
    windowDaysText: string,
    ceiling: string,
    visible: string,
    description: string,
    expiresAt: string,
    phoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.discountText = discountText;
    this.startsAt = startsAt;
    this.windowDaysText = windowDaysText;
    this.ceiling = ceiling;
    this.visible = visible;
    this.description = description;
    this.expiresAt = expiresAt;
    this.phoneText = phoneText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientLevelProposalView(item: LenientLevelProposal): LenientLevelProposalView {
  return new LenientLevelProposalView(
    item.code,
    item.label,
    item.discount.toFixed(2),
    String(item.startsAt),
    String(item.windowDays),
    item.ceiling.toFixed(2),
    `${item.visible}`,
    item.description,
    String(item.expiresAt),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientLevelProposalViews(items: LenientLevelProposal[]): LenientLevelProposalView[] {
  const views: LenientLevelProposalView[] = [];
  for (const item of items) {
    views.push(toLenientLevelProposalView(item));
  }
  return views;
}

export function sumLenientLevelProposalView(view: LenientLevelProposalView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedDiscount + parsedStartsAt + parsedWindowDays;
}
