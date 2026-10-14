import * as text from "../../../../kit/text.js";
import { TierWindow } from "./tier-window.js";

/** How screens and exports show a tier window. */
export class TierWindowView {
  code: string;
  name: string;
  ceiling: string;
  approved: string;
  summary: string;
  expiresAtText: string;
  contactEmail: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ceiling: string,
    approved: string,
    summary: string,
    expiresAtText: string,
    contactEmail: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.approved = approved;
    this.summary = summary;
    this.expiresAtText = expiresAtText;
    this.contactEmail = contactEmail;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toTierWindowView(item: TierWindow): TierWindowView {
  return new TierWindowView(
    item.code,
    item.name,
    item.ceiling.toFixed(2),
    `${item.approved}`,
    text.truncate(item.summary, 80),
    String(item.expiresAt),
    item.contactEmail,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierWindowViews(items: TierWindow[]): TierWindowView[] {
  const views: TierWindowView[] = [];
  for (const item of items) {
    views.push(toTierWindowView(item));
  }
  return views;
}

export function sumTierWindowView(view: TierWindowView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCeiling + parsedExpiresAt + parsedCreatedAt;
}
