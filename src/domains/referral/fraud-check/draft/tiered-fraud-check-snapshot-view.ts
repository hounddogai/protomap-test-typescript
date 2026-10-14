import { TieredFraudCheckSnapshot } from "./tiered-fraud-check-snapshot.js";

/** How screens and exports show a tiered fraud check snapshot. */
export class TieredFraudCheckSnapshotView {
  code: string;
  label: string;
  revision: string;
  frequencyCap: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    frequencyCap: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredFraudCheckSnapshotView(item: TieredFraudCheckSnapshot): TieredFraudCheckSnapshotView {
  return new TieredFraudCheckSnapshotView(
    item.code,
    item.label,
    String(item.revision),
    String(item.frequencyCap),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredFraudCheckSnapshotViews(items: TieredFraudCheckSnapshot[]): TieredFraudCheckSnapshotView[] {
  const views: TieredFraudCheckSnapshotView[] = [];
  for (const item of items) {
    views.push(toTieredFraudCheckSnapshotView(item));
  }
  return views;
}

export function sumTieredFraudCheckSnapshotView(view: TieredFraudCheckSnapshotView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedRevision + parsedFrequencyCap + parsedClicks;
}
