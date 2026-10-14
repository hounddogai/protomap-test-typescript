import * as text from "../../../../kit/text.js";
import { CappedCohortBundle } from "./capped-cohort-bundle.js";

/** How screens and exports show a capped cohort bundle. */
export class CappedCohortBundleView {
  codeText: string;
  nameText: string;
  floorValue: string;
  contactEmail: string;
  weight: string;
  startsAtText: string;
  variant: string;
  versionText: string;
  sendAt: string;
  archived: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    floorValue: string,
    contactEmail: string,
    weight: string,
    startsAtText: string,
    variant: string,
    versionText: string,
    sendAt: string,
    archived: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.floorValue = floorValue;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.startsAtText = startsAtText;
    this.variant = variant;
    this.versionText = versionText;
    this.sendAt = sendAt;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toCappedCohortBundleView(item: CappedCohortBundle): CappedCohortBundleView {
  return new CappedCohortBundleView(
    text.truncate(item.code, 64),
    item.name,
    item.floorValue.toFixed(2),
    item.contactEmail,
    item.weight.toFixed(2),
    String(item.startsAt),
    item.variant,
    String(item.version),
    String(item.sendAt),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedCohortBundleViews(items: CappedCohortBundle[]): CappedCohortBundleView[] {
  const views: CappedCohortBundleView[] = [];
  for (const item of items) {
    views.push(toCappedCohortBundleView(item));
  }
  return views;
}

export function sumCappedCohortBundleView(view: CappedCohortBundleView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedFloorValue + parsedWeight + parsedStartsAt;
}
