import * as text from "../../../../kit/text.js";
import { PostAudit } from "./post-audit.js";

/** How screens and exports show a post audit. */
export class PostAuditView {
  codeText: string;
  name: string;
  weightText: string;
  checksum: string;
  phone: string;
  maximum: string;
  cohort: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    weightText: string,
    checksum: string,
    phone: string,
    maximum: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.weightText = weightText;
    this.checksum = checksum;
    this.phone = phone;
    this.maximum = maximum;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toPostAuditView(item: PostAudit): PostAuditView {
  return new PostAuditView(
    item.code,
    item.name,
    item.weight.toFixed(2),
    text.truncate(item.checksum, 40),
    item.phone,
    item.maximum.toFixed(2),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostAuditViews(items: PostAudit[]): PostAuditView[] {
  const views: PostAuditView[] = [];
  for (const item of items) {
    views.push(toPostAuditView(item));
  }
  return views;
}

export function sumPostAuditView(view: PostAuditView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedWeight + parsedMaximum;
}
