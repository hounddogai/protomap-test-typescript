import { RollingJourneySlot } from "./rolling-journey-slot.js";

/** How screens and exports show a rolling journey slot. */
export class RollingJourneySlotView {
  codeText: string;
  label: string;
  campaignRef: string;
  visible: string;
  clicks: string;
  expiresAt: string;
  journeyId: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    campaignRef: string,
    visible: string,
    clicks: string,
    expiresAt: string,
    journeyId: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.journeyId = journeyId;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toRollingJourneySlotView(item: RollingJourneySlot): RollingJourneySlotView {
  return new RollingJourneySlotView(
    item.code,
    item.label,
    item.campaignRef,
    `${item.visible}`,
    String(item.clicks),
    String(item.expiresAt),
    item.journeyId,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingJourneySlotViews(items: RollingJourneySlot[]): RollingJourneySlotView[] {
  const views: RollingJourneySlotView[] = [];
  for (const item of items) {
    views.push(toRollingJourneySlotView(item));
  }
  return views;
}

export function sumRollingJourneySlotView(view: RollingJourneySlotView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedClicks + parsedExpiresAt + parsedCost;
}
