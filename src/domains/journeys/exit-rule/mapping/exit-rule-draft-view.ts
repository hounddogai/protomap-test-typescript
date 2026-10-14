import * as text from "../../../../kit/text.js";
import { ExitRuleDraft } from "./exit-rule-draft.js";

/** How screens and exports show a exit rule draft. */
export class ExitRuleDraftView {
  code: string;
  title: string;
  locale: string;
  attempts: string;
  country: string;
  statusLabel: string;

  constructor(code: string, title: string, locale: string, attempts: string, country: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.attempts = attempts;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleDraftView(item: ExitRuleDraft): ExitRuleDraftView {
  return new ExitRuleDraftView(
    item.code,
    item.title,
    text.truncate(item.locale, 40),
    String(item.attempts),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleDraftViews(items: ExitRuleDraft[]): ExitRuleDraftView[] {
  const views: ExitRuleDraftView[] = [];
  for (const item of items) {
    views.push(toExitRuleDraftView(item));
  }
  return views;
}

export function sumExitRuleDraftView(view: ExitRuleDraftView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAttempts;
}
