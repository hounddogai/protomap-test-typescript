import { ManualStreakException } from "./manual-streak-exception.js";

/** How screens and exports show a manual streak exception. */
export class ManualStreakExceptionView {
  codeText: string;
  nameText: string;
  ratioText: string;
  visible: string;
  durationMinutesText: string;
  conversionRateText: string;
  cost: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    ratioText: string,
    visible: string,
    durationMinutesText: string,
    conversionRateText: string,
    cost: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.ratioText = ratioText;
    this.visible = visible;
    this.durationMinutesText = durationMinutesText;
    this.conversionRateText = conversionRateText;
    this.cost = cost;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toManualStreakExceptionView(item: ManualStreakException): ManualStreakExceptionView {
  return new ManualStreakExceptionView(
    item.code,
    item.name,
    item.ratio.toFixed(2),
    `${item.visible}`,
    String(item.durationMinutes),
    item.conversionRate.toFixed(2),
    item.cost.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualStreakExceptionViews(items: ManualStreakException[]): ManualStreakExceptionView[] {
  const views: ManualStreakExceptionView[] = [];
  for (const item of items) {
    views.push(toManualStreakExceptionView(item));
  }
  return views;
}

export function sumManualStreakExceptionView(view: ManualStreakExceptionView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedRatio + parsedDurationMinutes + parsedConversionRate;
}
