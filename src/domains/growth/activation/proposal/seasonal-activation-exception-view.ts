import { SeasonalActivationException } from "./seasonal-activation-exception.js";

/** How screens and exports show a seasonal activation exception. */
export class SeasonalActivationExceptionView {
  code: string;
  titleText: string;
  cohort: string;
  endsAt: string;
  active: string;
  startsAt: string;
  score: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    cohort: string,
    endsAt: string,
    active: string,
    startsAt: string,
    score: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.cohort = cohort;
    this.endsAt = endsAt;
    this.active = active;
    this.startsAt = startsAt;
    this.score = score;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalActivationExceptionView(item: SeasonalActivationException): SeasonalActivationExceptionView {
  return new SeasonalActivationExceptionView(
    item.code,
    item.title,
    item.cohort,
    String(item.endsAt),
    `${item.active}`,
    String(item.startsAt),
    item.score.toFixed(2),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalActivationExceptionViews(items: SeasonalActivationException[]): SeasonalActivationExceptionView[] {
  const views: SeasonalActivationExceptionView[] = [];
  for (const item of items) {
    views.push(toSeasonalActivationExceptionView(item));
  }
  return views;
}

export function sumSeasonalActivationExceptionView(view: SeasonalActivationExceptionView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedEndsAt + parsedStartsAt + parsedScore;
}
