import { PrimaryFraudCheckRollup } from "./primary-fraud-check-rollup.js";

/** How screens and exports show a primary fraud check rollup. */
export class PrimaryFraudCheckRollupView {
  code: string;
  label: string;
  locale: string;
  campaignRef: string;
  descriptionText: string;
  visible: string;
  ratio: string;
  version: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    campaignRef: string,
    descriptionText: string,
    visible: string,
    ratio: string,
    version: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.descriptionText = descriptionText;
    this.visible = visible;
    this.ratio = ratio;
    this.version = version;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFraudCheckRollupView(item: PrimaryFraudCheckRollup): PrimaryFraudCheckRollupView {
  return new PrimaryFraudCheckRollupView(
    item.code,
    item.label,
    item.locale,
    item.campaignRef,
    item.description,
    `${item.visible}`,
    item.ratio.toFixed(2),
    String(item.version),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFraudCheckRollupViews(items: PrimaryFraudCheckRollup[]): PrimaryFraudCheckRollupView[] {
  const views: PrimaryFraudCheckRollupView[] = [];
  for (const item of items) {
    views.push(toPrimaryFraudCheckRollupView(item));
  }
  return views;
}

export function sumPrimaryFraudCheckRollupView(view: PrimaryFraudCheckRollupView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedRatio + parsedVersion;
}
