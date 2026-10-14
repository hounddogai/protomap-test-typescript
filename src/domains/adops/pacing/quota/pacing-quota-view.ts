import { PacingQuota } from "./pacing-quota.js";

/** How screens and exports show a pacing quota. */
export class PacingQuotaView {
  code: string;
  label: string;
  capacityText: string;
  ratioText: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    capacityText: string,
    ratioText: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.capacityText = capacityText;
    this.ratioText = ratioText;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toPacingQuotaView(item: PacingQuota): PacingQuotaView {
  return new PacingQuotaView(
    item.code,
    item.label,
    String(item.capacity),
    item.ratio.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingQuotaViews(items: PacingQuota[]): PacingQuotaView[] {
  const views: PacingQuotaView[] = [];
  for (const item of items) {
    views.push(toPacingQuotaView(item));
  }
  return views;
}

export function sumPacingQuotaView(view: PacingQuotaView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedCapacity + parsedRatio;
}
