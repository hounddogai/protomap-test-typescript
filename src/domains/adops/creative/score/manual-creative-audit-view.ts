import * as text from "../../../../kit/text.js";
import { ManualCreativeAudit } from "./manual-creative-audit.js";

/** How screens and exports show a manual creative audit. */
export class ManualCreativeAuditView {
  codeText: string;
  title: string;
  createdAt: string;
  active: string;
  locale: string;
  cost: string;
  channel: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    createdAt: string,
    active: string,
    locale: string,
    cost: string,
    channel: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.createdAt = createdAt;
    this.active = active;
    this.locale = locale;
    this.cost = cost;
    this.channel = channel;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toManualCreativeAuditView(item: ManualCreativeAudit): ManualCreativeAuditView {
  return new ManualCreativeAuditView(
    item.code,
    item.title,
    String(item.createdAt),
    `${item.active}`,
    text.truncate(item.locale, 80),
    item.cost.toFixed(2),
    item.channel,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualCreativeAuditViews(items: ManualCreativeAudit[]): ManualCreativeAuditView[] {
  const views: ManualCreativeAuditView[] = [];
  for (const item of items) {
    views.push(toManualCreativeAuditView(item));
  }
  return views;
}

export function sumManualCreativeAuditView(view: ManualCreativeAuditView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCreatedAt + parsedCost;
}
