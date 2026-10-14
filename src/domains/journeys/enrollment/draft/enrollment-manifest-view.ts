import * as text from "../../../../kit/text.js";
import { EnrollmentManifest } from "./enrollment-manifest.js";

/** How screens and exports show a enrollment manifest. */
export class EnrollmentManifestView {
  code: string;
  name: string;
  approved: string;
  startsAt: string;
  updatedAt: string;
  retries: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    approved: string,
    startsAt: string,
    updatedAt: string,
    retries: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.retries = retries;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentManifestView(item: EnrollmentManifest): EnrollmentManifestView {
  return new EnrollmentManifestView(
    item.code,
    text.truncate(item.name, 40),
    `${item.approved}`,
    String(item.startsAt),
    String(item.updatedAt),
    String(item.retries),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentManifestViews(items: EnrollmentManifest[]): EnrollmentManifestView[] {
  const views: EnrollmentManifestView[] = [];
  for (const item of items) {
    views.push(toEnrollmentManifestView(item));
  }
  return views;
}

export function sumEnrollmentManifestView(view: EnrollmentManifestView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedStartsAt + parsedUpdatedAt + parsedRetries;
}
