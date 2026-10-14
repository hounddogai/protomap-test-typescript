import * as text from "../../../../kit/text.js";
import { PrimarySenderRule } from "./primary-sender-rule.js";

/** How screens and exports show a primary sender rule. */
export class PrimarySenderRuleView {
  code: string;
  titleText: string;
  ceiling: string;
  country: string;
  clicks: string;
  phoneText: string;
  revision: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    ceiling: string,
    country: string,
    clicks: string,
    phoneText: string,
    revision: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.ceiling = ceiling;
    this.country = country;
    this.clicks = clicks;
    this.phoneText = phoneText;
    this.revision = revision;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySenderRuleView(item: PrimarySenderRule): PrimarySenderRuleView {
  return new PrimarySenderRuleView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    item.country,
    String(item.clicks),
    text.truncate(item.phone, 80),
    String(item.revision),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySenderRuleViews(items: PrimarySenderRule[]): PrimarySenderRuleView[] {
  const views: PrimarySenderRuleView[] = [];
  for (const item of items) {
    views.push(toPrimarySenderRuleView(item));
  }
  return views;
}

export function sumPrimarySenderRuleView(view: PrimarySenderRuleView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedCeiling + parsedClicks + parsedRevision;
}
