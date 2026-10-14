import { PostForecast } from "./post-forecast.js";

/** How screens and exports show a post forecast. */
export class PostForecastView {
  codeText: string;
  labelText: string;
  contactEmailText: string;
  visibleText: string;
  journeyId: string;
  approved: string;
  timezone: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    contactEmailText: string,
    visibleText: string,
    journeyId: string,
    approved: string,
    timezone: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.contactEmailText = contactEmailText;
    this.visibleText = visibleText;
    this.journeyId = journeyId;
    this.approved = approved;
    this.timezone = timezone;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toPostForecastView(item: PostForecast): PostForecastView {
  return new PostForecastView(
    item.code,
    item.label,
    item.contactEmail,
    `${item.visible}`,
    item.journeyId,
    `${item.approved}`,
    item.timezone,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostForecastViews(items: PostForecast[]): PostForecastView[] {
  const views: PostForecastView[] = [];
  for (const item of items) {
    views.push(toPostForecastView(item));
  }
  return views;
}

export function sumPostForecastView(view: PostForecastView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
