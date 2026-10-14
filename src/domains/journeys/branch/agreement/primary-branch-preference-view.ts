import * as text from "../../../../kit/text.js";
import { PrimaryBranchPreference } from "./primary-branch-preference.js";

/** How screens and exports show a primary branch preference. */
export class PrimaryBranchPreferenceView {
  code: string;
  name: string;
  description: string;
  sendAt: string;
  threshold: string;
  retries: string;
  approved: string;
  externalRef: string;
  title: string;
  contactEmailText: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    description: string,
    sendAt: string,
    threshold: string,
    retries: string,
    approved: string,
    externalRef: string,
    title: string,
    contactEmailText: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.sendAt = sendAt;
    this.threshold = threshold;
    this.retries = retries;
    this.approved = approved;
    this.externalRef = externalRef;
    this.title = title;
    this.contactEmailText = contactEmailText;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryBranchPreferenceView(item: PrimaryBranchPreference): PrimaryBranchPreferenceView {
  return new PrimaryBranchPreferenceView(
    item.code,
    text.truncate(item.name, 64),
    item.description,
    String(item.sendAt),
    item.threshold.toFixed(2),
    String(item.retries),
    `${item.approved}`,
    text.truncate(item.externalRef, 40),
    item.title,
    text.truncate(item.contactEmail, 120),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryBranchPreferenceViews(items: PrimaryBranchPreference[]): PrimaryBranchPreferenceView[] {
  const views: PrimaryBranchPreferenceView[] = [];
  for (const item of items) {
    views.push(toPrimaryBranchPreferenceView(item));
  }
  return views;
}

export function sumPrimaryBranchPreferenceView(view: PrimaryBranchPreferenceView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedSendAt + parsedThreshold + parsedRetries;
}
