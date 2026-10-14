import { LegacyProofCycle } from "./legacy-proof-cycle.js";

/** How screens and exports show a legacy proof cycle. */
export class LegacyProofCycleView {
  code: string;
  label: string;
  contactEmail: string;
  maximumText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    maximumText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.maximumText = maximumText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyProofCycleView(item: LegacyProofCycle): LegacyProofCycleView {
  return new LegacyProofCycleView(
    item.code,
    item.label,
    item.contactEmail,
    item.maximum.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyProofCycleViews(items: LegacyProofCycle[]): LegacyProofCycleView[] {
  const views: LegacyProofCycleView[] = [];
  for (const item of items) {
    views.push(toLegacyProofCycleView(item));
  }
  return views;
}

export function sumLegacyProofCycleView(view: LegacyProofCycleView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedMaximum + parsedCeiling;
}
