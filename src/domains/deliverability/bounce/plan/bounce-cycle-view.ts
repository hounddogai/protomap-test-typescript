import * as text from "../../../../kit/text.js";
import { BounceCycle } from "./bounce-cycle.js";

/** How screens and exports show a bounce cycle. */
export class BounceCycleView {
  codeText: string;
  label: string;
  externalRefText: string;
  updatedAt: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    externalRefText: string,
    updatedAt: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.externalRefText = externalRefText;
    this.updatedAt = updatedAt;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toBounceCycleView(item: BounceCycle): BounceCycleView {
  return new BounceCycleView(
    text.truncate(item.code, 64),
    item.label,
    text.truncate(item.externalRef, 40),
    String(item.updatedAt),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceCycleViews(items: BounceCycle[]): BounceCycleView[] {
  const views: BounceCycleView[] = [];
  for (const item of items) {
    views.push(toBounceCycleView(item));
  }
  return views;
}

export function sumBounceCycleView(view: BounceCycleView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedUpdatedAt;
}
