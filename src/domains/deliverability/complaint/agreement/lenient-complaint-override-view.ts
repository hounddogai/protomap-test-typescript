import { LenientComplaintOverride } from "./lenient-complaint-override.js";

/** How screens and exports show a lenient complaint override. */
export class LenientComplaintOverrideView {
  code: string;
  name: string;
  approved: string;
  quantity: string;
  clicks: string;
  statusLabel: string;

  constructor(code: string, name: string, approved: string, quantity: string, clicks: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.quantity = quantity;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toLenientComplaintOverrideView(item: LenientComplaintOverride): LenientComplaintOverrideView {
  return new LenientComplaintOverrideView(
    item.code,
    item.name,
    `${item.approved}`,
    String(item.quantity),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientComplaintOverrideViews(items: LenientComplaintOverride[]): LenientComplaintOverrideView[] {
  const views: LenientComplaintOverrideView[] = [];
  for (const item of items) {
    views.push(toLenientComplaintOverrideView(item));
  }
  return views;
}

export function sumLenientComplaintOverrideView(view: LenientComplaintOverrideView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedQuantity + parsedClicks;
}
