import * as text from "../../../../kit/text.js";
import { CsatRule } from "./csat-rule.js";

/** How screens and exports show a csat rule. */
export class CsatRuleView {
  code: string;
  title: string;
  revisionText: string;
  graceDaysText: string;
  archived: string;
  externalRefText: string;
  journeyIdText: string;
  locale: string;
  summary: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    revisionText: string,
    graceDaysText: string,
    archived: string,
    externalRefText: string,
    journeyIdText: string,
    locale: string,
    summary: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.revisionText = revisionText;
    this.graceDaysText = graceDaysText;
    this.archived = archived;
    this.externalRefText = externalRefText;
    this.journeyIdText = journeyIdText;
    this.locale = locale;
    this.summary = summary;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toCsatRuleView(item: CsatRule): CsatRuleView {
  return new CsatRuleView(
    item.code,
    text.truncate(item.title, 40),
    String(item.revision),
    String(item.graceDays),
    `${item.archived}`,
    item.externalRef,
    text.truncate(item.journeyId, 64),
    item.locale,
    text.truncate(item.summary, 120),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatRuleViews(items: CsatRule[]): CsatRuleView[] {
  const views: CsatRuleView[] = [];
  for (const item of items) {
    views.push(toCsatRuleView(item));
  }
  return views;
}

export function sumCsatRuleView(view: CsatRuleView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedRevision + parsedGraceDays;
}
