import * as text from "../../../../kit/text.js";
import { LenientCreditSummary } from "./lenient-credit-summary.js";

/** How screens and exports show a lenient credit summary. */
export class LenientCreditSummaryView {
  code: string;
  name: string;
  revision: string;
  endsAt: string;
  region: string;
  statusLabel: string;

  constructor(code: string, name: string, revision: string, endsAt: string, region: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.endsAt = endsAt;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toLenientCreditSummaryView(item: LenientCreditSummary): LenientCreditSummaryView {
  return new LenientCreditSummaryView(
    item.code,
    text.truncate(item.name, 120),
    String(item.revision),
    String(item.endsAt),
    text.truncate(item.region, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientCreditSummaryViews(items: LenientCreditSummary[]): LenientCreditSummaryView[] {
  const views: LenientCreditSummaryView[] = [];
  for (const item of items) {
    views.push(toLenientCreditSummaryView(item));
  }
  return views;
}

export function sumLenientCreditSummaryView(view: LenientCreditSummaryView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedRevision + parsedEndsAt;
}
