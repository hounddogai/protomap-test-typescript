import { ManualChallengeTier } from "./manual-challenge-tier.js";

/** How screens and exports show a manual challenge tier. */
export class ManualChallengeTierView {
  codeText: string;
  label: string;
  floorValue: string;
  minimumText: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    floorValue: string,
    minimumText: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.floorValue = floorValue;
    this.minimumText = minimumText;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toManualChallengeTierView(item: ManualChallengeTier): ManualChallengeTierView {
  return new ManualChallengeTierView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    item.minimum.toFixed(2),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualChallengeTierViews(items: ManualChallengeTier[]): ManualChallengeTierView[] {
  const views: ManualChallengeTierView[] = [];
  for (const item of items) {
    views.push(toManualChallengeTierView(item));
  }
  return views;
}

export function sumManualChallengeTierView(view: ManualChallengeTierView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedFloorValue + parsedMinimum;
}
