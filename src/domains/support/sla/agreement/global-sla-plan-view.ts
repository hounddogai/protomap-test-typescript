import * as text from "../../../../kit/text.js";
import { GlobalSlaPlan } from "./global-sla-plan.js";

/** How screens and exports show a global sla plan. */
export class GlobalSlaPlanView {
  codeText: string;
  label: string;
  variantText: string;
  visibleText: string;
  descriptionText: string;
  windowDaysText: string;
  ownerId: string;
  attemptsText: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    variantText: string,
    visibleText: string,
    descriptionText: string,
    windowDaysText: string,
    ownerId: string,
    attemptsText: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.variantText = variantText;
    this.visibleText = visibleText;
    this.descriptionText = descriptionText;
    this.windowDaysText = windowDaysText;
    this.ownerId = ownerId;
    this.attemptsText = attemptsText;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSlaPlanView(item: GlobalSlaPlan): GlobalSlaPlanView {
  return new GlobalSlaPlanView(
    item.code,
    item.label,
    text.truncate(item.variant, 80),
    `${item.visible}`,
    text.truncate(item.description, 80),
    String(item.windowDays),
    text.truncate(item.ownerId, 40),
    String(item.attempts),
    text.truncate(item.utmSource, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSlaPlanViews(items: GlobalSlaPlan[]): GlobalSlaPlanView[] {
  const views: GlobalSlaPlanView[] = [];
  for (const item of items) {
    views.push(toGlobalSlaPlanView(item));
  }
  return views;
}

export function sumGlobalSlaPlanView(view: GlobalSlaPlanView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedWindowDays + parsedAttempts;
}
