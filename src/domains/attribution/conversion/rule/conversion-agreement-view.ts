import { ConversionAgreement } from "./conversion-agreement.js";

/** How screens and exports show a conversion agreement. */
export class ConversionAgreementView {
  codeText: string;
  name: string;
  cohortText: string;
  region: string;
  campaignRef: string;
  revision: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cohortText: string,
    region: string,
    campaignRef: string,
    revision: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cohortText = cohortText;
    this.region = region;
    this.campaignRef = campaignRef;
    this.revision = revision;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toConversionAgreementView(item: ConversionAgreement): ConversionAgreementView {
  return new ConversionAgreementView(
    item.code,
    item.name,
    item.cohort,
    item.region,
    item.campaignRef,
    String(item.revision),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionAgreementViews(items: ConversionAgreement[]): ConversionAgreementView[] {
  const views: ConversionAgreementView[] = [];
  for (const item of items) {
    views.push(toConversionAgreementView(item));
  }
  return views;
}

export function sumConversionAgreementView(view: ConversionAgreementView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
