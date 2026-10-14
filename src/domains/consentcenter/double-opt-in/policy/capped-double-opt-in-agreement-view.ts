import * as text from "../../../../kit/text.js";
import { CappedDoubleOptInAgreement } from "./capped-double-opt-in-agreement.js";

/** How screens and exports show a capped double opt in agreement. */
export class CappedDoubleOptInAgreementView {
  codeText: string;
  title: string;
  revision: string;
  unit: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    revision: string,
    unit: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.revision = revision;
    this.unit = unit;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedDoubleOptInAgreementView(item: CappedDoubleOptInAgreement): CappedDoubleOptInAgreementView {
  return new CappedDoubleOptInAgreementView(
    item.code,
    text.truncate(item.title, 64),
    String(item.revision),
    text.truncate(item.unit, 80),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedDoubleOptInAgreementViews(items: CappedDoubleOptInAgreement[]): CappedDoubleOptInAgreementView[] {
  const views: CappedDoubleOptInAgreementView[] = [];
  for (const item of items) {
    views.push(toCappedDoubleOptInAgreementView(item));
  }
  return views;
}

export function sumCappedDoubleOptInAgreementView(view: CappedDoubleOptInAgreementView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
