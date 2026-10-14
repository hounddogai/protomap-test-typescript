import { ScheduledFraudCheckTemplate } from "./scheduled-fraud-check-template.js";

/** How screens and exports show a scheduled fraud check template. */
export class ScheduledFraudCheckTemplateView {
  code: string;
  titleText: string;
  sourceText: string;
  attemptsText: string;
  active: string;
  description: string;
  scoreText: string;
  conversionRate: string;
  locale: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    sourceText: string,
    attemptsText: string,
    active: string,
    description: string,
    scoreText: string,
    conversionRate: string,
    locale: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.sourceText = sourceText;
    this.attemptsText = attemptsText;
    this.active = active;
    this.description = description;
    this.scoreText = scoreText;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFraudCheckTemplateView(item: ScheduledFraudCheckTemplate): ScheduledFraudCheckTemplateView {
  return new ScheduledFraudCheckTemplateView(
    item.code,
    item.title,
    item.source,
    String(item.attempts),
    `${item.active}`,
    item.description,
    item.score.toFixed(2),
    item.conversionRate.toFixed(2),
    item.locale,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFraudCheckTemplateViews(items: ScheduledFraudCheckTemplate[]): ScheduledFraudCheckTemplateView[] {
  const views: ScheduledFraudCheckTemplateView[] = [];
  for (const item of items) {
    views.push(toScheduledFraudCheckTemplateView(item));
  }
  return views;
}

export function sumScheduledFraudCheckTemplateView(view: ScheduledFraudCheckTemplateView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedAttempts + parsedScore + parsedConversionRate;
}
