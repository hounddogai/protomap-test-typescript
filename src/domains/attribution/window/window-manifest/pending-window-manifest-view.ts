import * as text from "../../../../kit/text.js";
import { PendingWindowManifest } from "./pending-window-manifest.js";

/** How screens and exports show a pending window manifest. */
export class PendingWindowManifestView {
  code: string;
  title: string;
  threshold: string;
  batchSizeText: string;
  visible: string;
  journeyId: string;
  version: string;
  ownerId: string;
  locale: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    threshold: string,
    batchSizeText: string,
    visible: string,
    journeyId: string,
    version: string,
    ownerId: string,
    locale: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.batchSizeText = batchSizeText;
    this.visible = visible;
    this.journeyId = journeyId;
    this.version = version;
    this.ownerId = ownerId;
    this.locale = locale;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingWindowManifestView(item: PendingWindowManifest): PendingWindowManifestView {
  return new PendingWindowManifestView(
    item.code,
    item.title,
    item.threshold.toFixed(2),
    String(item.batchSize),
    `${item.visible}`,
    item.journeyId,
    String(item.version),
    text.truncate(item.ownerId, 120),
    item.locale,
    text.truncate(item.currency, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingWindowManifestViews(items: PendingWindowManifest[]): PendingWindowManifestView[] {
  const views: PendingWindowManifestView[] = [];
  for (const item of items) {
    views.push(toPendingWindowManifestView(item));
  }
  return views;
}

export function sumPendingWindowManifestView(view: PendingWindowManifestView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedThreshold + parsedBatchSize + parsedVersion;
}
