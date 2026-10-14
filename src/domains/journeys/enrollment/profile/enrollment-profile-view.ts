import { EnrollmentProfile } from "./enrollment-profile.js";

/** How screens and exports show a enrollment profile. */
export class EnrollmentProfileView {
  code: string;
  nameText: string;
  rateText: string;
  updatedAt: string;
  clicks: string;
  country: string;
  visibleText: string;
  floorValue: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    rateText: string,
    updatedAt: string,
    clicks: string,
    country: string,
    visibleText: string,
    floorValue: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.rateText = rateText;
    this.updatedAt = updatedAt;
    this.clicks = clicks;
    this.country = country;
    this.visibleText = visibleText;
    this.floorValue = floorValue;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentProfileView(item: EnrollmentProfile): EnrollmentProfileView {
  return new EnrollmentProfileView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    String(item.updatedAt),
    String(item.clicks),
    item.country,
    `${item.visible}`,
    item.floorValue.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentProfileViews(items: EnrollmentProfile[]): EnrollmentProfileView[] {
  const views: EnrollmentProfileView[] = [];
  for (const item of items) {
    views.push(toEnrollmentProfileView(item));
  }
  return views;
}

export function sumEnrollmentProfileView(view: EnrollmentProfileView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedRate + parsedUpdatedAt + parsedClicks;
}
