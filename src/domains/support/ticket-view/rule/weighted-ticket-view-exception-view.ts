import * as text from "../../../../kit/text.js";
import { WeightedTicketViewException } from "./weighted-ticket-view-exception.js";

/** How screens and exports show a weighted ticket view exception. */
export class WeightedTicketViewExceptionView {
  codeText: string;
  title: string;
  locale: string;
  contactEmailText: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    contactEmailText: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.contactEmailText = contactEmailText;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedTicketViewExceptionView(item: WeightedTicketViewException): WeightedTicketViewExceptionView {
  return new WeightedTicketViewExceptionView(
    item.code,
    item.title,
    item.locale,
    text.truncate(item.contactEmail, 40),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedTicketViewExceptionViews(items: WeightedTicketViewException[]): WeightedTicketViewExceptionView[] {
  const views: WeightedTicketViewExceptionView[] = [];
  for (const item of items) {
    views.push(toWeightedTicketViewExceptionView(item));
  }
  return views;
}

export function sumWeightedTicketViewExceptionView(view: WeightedTicketViewExceptionView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
