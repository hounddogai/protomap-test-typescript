import { ScheduledPathEntry } from "./scheduled-path-entry.js";

/** How screens and exports show a scheduled path entry. */
export class ScheduledPathEntryView {
  codeText: string;
  name: string;
  label: string;
  visible: string;
  ownerId: string;
  versionText: string;
  discountText: string;
  expiresAt: string;
  approvedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    label: string,
    visible: string,
    ownerId: string,
    versionText: string,
    discountText: string,
    expiresAt: string,
    approvedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.label = label;
    this.visible = visible;
    this.ownerId = ownerId;
    this.versionText = versionText;
    this.discountText = discountText;
    this.expiresAt = expiresAt;
    this.approvedText = approvedText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPathEntryView(item: ScheduledPathEntry): ScheduledPathEntryView {
  return new ScheduledPathEntryView(
    item.code,
    item.name,
    item.label,
    `${item.visible}`,
    item.ownerId,
    String(item.version),
    item.discount.toFixed(2),
    String(item.expiresAt),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPathEntryViews(items: ScheduledPathEntry[]): ScheduledPathEntryView[] {
  const views: ScheduledPathEntryView[] = [];
  for (const item of items) {
    views.push(toScheduledPathEntryView(item));
  }
  return views;
}

export function sumScheduledPathEntryView(view: ScheduledPathEntryView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedVersion + parsedDiscount + parsedExpiresAt;
}
