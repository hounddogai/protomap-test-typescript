import * as text from "../../../../kit/text.js";
import { GlobalExitRuleDigest } from "./global-exit-rule-digest.js";

/** How screens and exports show a global exit rule digest. */
export class GlobalExitRuleDigestView {
  codeText: string;
  label: string;
  locale: string;
  visible: string;
  durationMinutes: string;
  name: string;
  graceDays: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    locale: string,
    visible: string,
    durationMinutes: string,
    name: string,
    graceDays: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.locale = locale;
    this.visible = visible;
    this.durationMinutes = durationMinutes;
    this.name = name;
    this.graceDays = graceDays;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalExitRuleDigestView(item: GlobalExitRuleDigest): GlobalExitRuleDigestView {
  return new GlobalExitRuleDigestView(
    item.code,
    text.truncate(item.label, 120),
    item.locale,
    `${item.visible}`,
    String(item.durationMinutes),
    item.name,
    String(item.graceDays),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalExitRuleDigestViews(items: GlobalExitRuleDigest[]): GlobalExitRuleDigestView[] {
  const views: GlobalExitRuleDigestView[] = [];
  for (const item of items) {
    views.push(toGlobalExitRuleDigestView(item));
  }
  return views;
}

export function sumGlobalExitRuleDigestView(view: GlobalExitRuleDigestView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedDurationMinutes + parsedGraceDays;
}
