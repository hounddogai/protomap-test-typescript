import { ManualPacingException } from "./manual-pacing-exception.js";

/** How screens and exports show a manual pacing exception. */
export class ManualPacingExceptionView {
  code: string;
  title: string;
  localeText: string;
  costText: string;
  reviewerText: string;
  rate: string;
  journeyId: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    localeText: string,
    costText: string,
    reviewerText: string,
    rate: string,
    journeyId: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.localeText = localeText;
    this.costText = costText;
    this.reviewerText = reviewerText;
    this.rate = rate;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toManualPacingExceptionView(item: ManualPacingException): ManualPacingExceptionView {
  return new ManualPacingExceptionView(
    item.code,
    item.title,
    item.locale,
    item.cost.toFixed(2),
    item.reviewer,
    item.rate.toFixed(2),
    item.journeyId,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPacingExceptionViews(items: ManualPacingException[]): ManualPacingExceptionView[] {
  const views: ManualPacingExceptionView[] = [];
  for (const item of items) {
    views.push(toManualPacingExceptionView(item));
  }
  return views;
}

export function sumManualPacingExceptionView(view: ManualPacingExceptionView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCost + parsedRate + parsedCreatedAt;
}
