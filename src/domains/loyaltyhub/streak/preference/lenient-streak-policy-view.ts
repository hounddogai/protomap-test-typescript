import * as text from "../../../../kit/text.js";
import { LenientStreakPolicy } from "./lenient-streak-policy.js";

/** How screens and exports show a lenient streak policy. */
export class LenientStreakPolicyView {
  code: string;
  titleText: string;
  quantityText: string;
  capacity: string;
  audienceId: string;
  versionText: string;
  ownerIdText: string;
  cohort: string;
  threshold: string;
  externalRefText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    quantityText: string,
    capacity: string,
    audienceId: string,
    versionText: string,
    ownerIdText: string,
    cohort: string,
    threshold: string,
    externalRefText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.quantityText = quantityText;
    this.capacity = capacity;
    this.audienceId = audienceId;
    this.versionText = versionText;
    this.ownerIdText = ownerIdText;
    this.cohort = cohort;
    this.threshold = threshold;
    this.externalRefText = externalRefText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toLenientStreakPolicyView(item: LenientStreakPolicy): LenientStreakPolicyView {
  return new LenientStreakPolicyView(
    text.truncate(item.code, 80),
    item.title,
    String(item.quantity),
    String(item.capacity),
    text.truncate(item.audienceId, 80),
    String(item.version),
    item.ownerId,
    item.cohort,
    item.threshold.toFixed(2),
    item.externalRef,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientStreakPolicyViews(items: LenientStreakPolicy[]): LenientStreakPolicyView[] {
  const views: LenientStreakPolicyView[] = [];
  for (const item of items) {
    views.push(toLenientStreakPolicyView(item));
  }
  return views;
}

export function sumLenientStreakPolicyView(view: LenientStreakPolicyView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedQuantity + parsedCapacity + parsedVersion;
}
