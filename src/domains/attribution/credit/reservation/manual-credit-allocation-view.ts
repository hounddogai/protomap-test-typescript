import { ManualCreditAllocation } from "./manual-credit-allocation.js";

/** How screens and exports show a manual credit allocation. */
export class ManualCreditAllocationView {
  codeText: string;
  title: string;
  windowDaysText: string;
  phone: string;
  scoreText: string;
  sendAt: string;
  floorValue: string;
  durationMinutes: string;
  createdAtText: string;
  maximum: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    windowDaysText: string,
    phone: string,
    scoreText: string,
    sendAt: string,
    floorValue: string,
    durationMinutes: string,
    createdAtText: string,
    maximum: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.windowDaysText = windowDaysText;
    this.phone = phone;
    this.scoreText = scoreText;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.createdAtText = createdAtText;
    this.maximum = maximum;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toManualCreditAllocationView(item: ManualCreditAllocation): ManualCreditAllocationView {
  return new ManualCreditAllocationView(
    item.code,
    item.title,
    String(item.windowDays),
    item.phone,
    item.score.toFixed(2),
    String(item.sendAt),
    item.floorValue.toFixed(2),
    String(item.durationMinutes),
    String(item.createdAt),
    item.maximum.toFixed(2),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualCreditAllocationViews(items: ManualCreditAllocation[]): ManualCreditAllocationView[] {
  const views: ManualCreditAllocationView[] = [];
  for (const item of items) {
    views.push(toManualCreditAllocationView(item));
  }
  return views;
}

export function sumManualCreditAllocationView(view: ManualCreditAllocationView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedWindowDays + parsedScore + parsedSendAt;
}
