import * as text from "../../../../kit/text.js";
import { SeasonalFraudCheckAudit } from "./seasonal-fraud-check-audit.js";

/** How screens and exports show a seasonal fraud check audit. */
export class SeasonalFraudCheckAuditView {
  code: string;
  title: string;
  checksum: string;
  amount: string;
  audienceId: string;
  startsAtText: string;
  segment: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    checksum: string,
    amount: string,
    audienceId: string,
    startsAtText: string,
    segment: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.amount = amount;
    this.audienceId = audienceId;
    this.startsAtText = startsAtText;
    this.segment = segment;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalFraudCheckAuditView(item: SeasonalFraudCheckAudit): SeasonalFraudCheckAuditView {
  return new SeasonalFraudCheckAuditView(
    text.truncate(item.code, 80),
    item.title,
    item.checksum,
    item.amount.toFixed(2),
    item.audienceId,
    String(item.startsAt),
    item.segment,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalFraudCheckAuditViews(items: SeasonalFraudCheckAudit[]): SeasonalFraudCheckAuditView[] {
  const views: SeasonalFraudCheckAuditView[] = [];
  for (const item of items) {
    views.push(toSeasonalFraudCheckAuditView(item));
  }
  return views;
}

export function sumSeasonalFraudCheckAuditView(view: SeasonalFraudCheckAuditView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedAmount + parsedStartsAt + parsedVersion;
}
