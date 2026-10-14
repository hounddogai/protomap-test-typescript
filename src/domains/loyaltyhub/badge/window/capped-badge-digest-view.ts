import * as text from "../../../../kit/text.js";
import { CappedBadgeDigest } from "./capped-badge-digest.js";

/** How screens and exports show a capped badge digest. */
export class CappedBadgeDigestView {
  code: string;
  nameText: string;
  attempts: string;
  versionText: string;
  title: string;
  createdAtText: string;
  budget: string;
  channel: string;
  notes: string;
  phoneText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    attempts: string,
    versionText: string,
    title: string,
    createdAtText: string,
    budget: string,
    channel: string,
    notes: string,
    phoneText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.attempts = attempts;
    this.versionText = versionText;
    this.title = title;
    this.createdAtText = createdAtText;
    this.budget = budget;
    this.channel = channel;
    this.notes = notes;
    this.phoneText = phoneText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toCappedBadgeDigestView(item: CappedBadgeDigest): CappedBadgeDigestView {
  return new CappedBadgeDigestView(
    item.code,
    item.name,
    String(item.attempts),
    String(item.version),
    item.title,
    String(item.createdAt),
    item.budget.toFixed(2),
    item.channel,
    item.notes,
    text.truncate(item.phone, 40),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedBadgeDigestViews(items: CappedBadgeDigest[]): CappedBadgeDigestView[] {
  const views: CappedBadgeDigestView[] = [];
  for (const item of items) {
    views.push(toCappedBadgeDigestView(item));
  }
  return views;
}

export function sumCappedBadgeDigestView(view: CappedBadgeDigestView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedAttempts + parsedVersion + parsedCreatedAt;
}
