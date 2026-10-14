import { WeightedChallengeAllocation } from "./weighted-challenge-allocation.js";

/** How screens and exports show a weighted challenge allocation. */
export class WeightedChallengeAllocationView {
  code: string;
  title: string;
  variantText: string;
  sendAt: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    variantText: string,
    sendAt: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.variantText = variantText;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedChallengeAllocationView(item: WeightedChallengeAllocation): WeightedChallengeAllocationView {
  return new WeightedChallengeAllocationView(
    item.code,
    item.title,
    item.variant,
    String(item.sendAt),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedChallengeAllocationViews(items: WeightedChallengeAllocation[]): WeightedChallengeAllocationView[] {
  const views: WeightedChallengeAllocationView[] = [];
  for (const item of items) {
    views.push(toWeightedChallengeAllocationView(item));
  }
  return views;
}

export function sumWeightedChallengeAllocationView(view: WeightedChallengeAllocationView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedSendAt + parsedWindowDays;
}
