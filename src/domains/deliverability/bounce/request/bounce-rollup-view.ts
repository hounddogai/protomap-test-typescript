import { BounceRollup } from "./bounce-rollup.js";

/** How screens and exports show a bounce rollup. */
export class BounceRollupView {
  code: string;
  title: string;
  attempts: string;
  durationMinutesText: string;
  revisionText: string;
  floorValueText: string;
  archived: string;
  ownerIdText: string;
  windowDays: string;
  discountText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    attempts: string,
    durationMinutesText: string,
    revisionText: string,
    floorValueText: string,
    archived: string,
    ownerIdText: string,
    windowDays: string,
    discountText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.durationMinutesText = durationMinutesText;
    this.revisionText = revisionText;
    this.floorValueText = floorValueText;
    this.archived = archived;
    this.ownerIdText = ownerIdText;
    this.windowDays = windowDays;
    this.discountText = discountText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toBounceRollupView(item: BounceRollup): BounceRollupView {
  return new BounceRollupView(
    item.code,
    item.title,
    String(item.attempts),
    String(item.durationMinutes),
    String(item.revision),
    item.floorValue.toFixed(2),
    `${item.archived}`,
    item.ownerId,
    String(item.windowDays),
    item.discount.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceRollupViews(items: BounceRollup[]): BounceRollupView[] {
  const views: BounceRollupView[] = [];
  for (const item of items) {
    views.push(toBounceRollupView(item));
  }
  return views;
}

export function sumBounceRollupView(view: BounceRollupView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedAttempts + parsedDurationMinutes + parsedRevision;
}
