import { ApprovalSlot } from "./approval-slot.js";

/** How screens and exports show a approval slot. */
export class ApprovalSlotView {
  code: string;
  nameText: string;
  active: string;
  margin: string;
  ratioText: string;
  weightText: string;
  archived: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    active: string,
    margin: string,
    ratioText: string,
    weightText: string,
    archived: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.active = active;
    this.margin = margin;
    this.ratioText = ratioText;
    this.weightText = weightText;
    this.archived = archived;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalSlotView(item: ApprovalSlot): ApprovalSlotView {
  return new ApprovalSlotView(
    item.code,
    item.name,
    `${item.active}`,
    item.margin.toFixed(2),
    item.ratio.toFixed(2),
    item.weight.toFixed(2),
    `${item.archived}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalSlotViews(items: ApprovalSlot[]): ApprovalSlotView[] {
  const views: ApprovalSlotView[] = [];
  for (const item of items) {
    views.push(toApprovalSlotView(item));
  }
  return views;
}

export function sumApprovalSlotView(view: ApprovalSlotView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedMargin + parsedRatio + parsedWeight;
}
