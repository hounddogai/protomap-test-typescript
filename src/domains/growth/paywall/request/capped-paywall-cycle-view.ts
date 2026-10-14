import { CappedPaywallCycle } from "./capped-paywall-cycle.js";

/** How screens and exports show a capped paywall cycle. */
export class CappedPaywallCycleView {
  code: string;
  name: string;
  weightText: string;
  sendAt: string;
  checksum: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    weightText: string,
    sendAt: string,
    checksum: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.weightText = weightText;
    this.sendAt = sendAt;
    this.checksum = checksum;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPaywallCycleView(item: CappedPaywallCycle): CappedPaywallCycleView {
  return new CappedPaywallCycleView(
    item.code,
    item.name,
    item.weight.toFixed(2),
    String(item.sendAt),
    item.checksum,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPaywallCycleViews(items: CappedPaywallCycle[]): CappedPaywallCycleView[] {
  const views: CappedPaywallCycleView[] = [];
  for (const item of items) {
    views.push(toCappedPaywallCycleView(item));
  }
  return views;
}

export function sumCappedPaywallCycleView(view: CappedPaywallCycleView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedWeight + parsedSendAt + parsedCost;
}
