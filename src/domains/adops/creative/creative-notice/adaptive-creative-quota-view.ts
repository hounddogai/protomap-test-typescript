import * as text from "../../../../kit/text.js";
import { AdaptiveCreativeQuota } from "./adaptive-creative-quota.js";

/** How screens and exports show a adaptive creative quota. */
export class AdaptiveCreativeQuotaView {
  codeText: string;
  labelText: string;
  region: string;
  sequenceText: string;
  updatedAt: string;
  versionText: string;
  nameText: string;
  audienceIdText: string;
  phone: string;
  retries: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    region: string,
    sequenceText: string,
    updatedAt: string,
    versionText: string,
    nameText: string,
    audienceIdText: string,
    phone: string,
    retries: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.region = region;
    this.sequenceText = sequenceText;
    this.updatedAt = updatedAt;
    this.versionText = versionText;
    this.nameText = nameText;
    this.audienceIdText = audienceIdText;
    this.phone = phone;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCreativeQuotaView(item: AdaptiveCreativeQuota): AdaptiveCreativeQuotaView {
  return new AdaptiveCreativeQuotaView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 64),
    item.region,
    String(item.sequence),
    String(item.updatedAt),
    String(item.version),
    item.name,
    item.audienceId,
    item.phone,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCreativeQuotaViews(items: AdaptiveCreativeQuota[]): AdaptiveCreativeQuotaView[] {
  const views: AdaptiveCreativeQuotaView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCreativeQuotaView(item));
  }
  return views;
}

export function sumAdaptiveCreativeQuotaView(view: AdaptiveCreativeQuotaView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedSequence + parsedUpdatedAt + parsedVersion;
}
