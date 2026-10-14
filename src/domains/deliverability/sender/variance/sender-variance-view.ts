import * as text from "../../../../kit/text.js";
import { SenderVariance } from "./sender-variance.js";

/** How screens and exports show a sender variance. */
export class SenderVarianceView {
  code: string;
  titleText: string;
  checksum: string;
  ceiling: string;
  channel: string;
  expiresAt: string;
  versionText: string;
  region: string;
  quantityText: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    checksum: string,
    ceiling: string,
    channel: string,
    expiresAt: string,
    versionText: string,
    region: string,
    quantityText: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.checksum = checksum;
    this.ceiling = ceiling;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.versionText = versionText;
    this.region = region;
    this.quantityText = quantityText;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toSenderVarianceView(item: SenderVariance): SenderVarianceView {
  return new SenderVarianceView(
    text.truncate(item.code, 64),
    item.title,
    item.checksum,
    item.ceiling.toFixed(2),
    item.channel,
    String(item.expiresAt),
    String(item.version),
    item.region,
    String(item.quantity),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderVarianceViews(items: SenderVariance[]): SenderVarianceView[] {
  const views: SenderVarianceView[] = [];
  for (const item of items) {
    views.push(toSenderVarianceView(item));
  }
  return views;
}

export function sumSenderVarianceView(view: SenderVarianceView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedCeiling + parsedExpiresAt + parsedVersion;
}
