import * as text from "../../../../kit/text.js";
import { CappedSlaAudit } from "./capped-sla-audit.js";

/** How screens and exports show a capped sla audit. */
export class CappedSlaAuditView {
  codeText: string;
  labelText: string;
  contactEmail: string;
  summary: string;
  impressions: string;
  variantText: string;
  countryText: string;
  ownerId: string;
  priorityText: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    contactEmail: string,
    summary: string,
    impressions: string,
    variantText: string,
    countryText: string,
    ownerId: string,
    priorityText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.impressions = impressions;
    this.variantText = variantText;
    this.countryText = countryText;
    this.ownerId = ownerId;
    this.priorityText = priorityText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toCappedSlaAuditView(item: CappedSlaAudit): CappedSlaAuditView {
  return new CappedSlaAuditView(
    item.code,
    item.label,
    item.contactEmail,
    text.truncate(item.summary, 80),
    String(item.impressions),
    item.variant,
    item.country,
    item.ownerId,
    String(item.priority),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedSlaAuditViews(items: CappedSlaAudit[]): CappedSlaAuditView[] {
  const views: CappedSlaAuditView[] = [];
  for (const item of items) {
    views.push(toCappedSlaAuditView(item));
  }
  return views;
}

export function sumCappedSlaAuditView(view: CappedSlaAuditView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedImpressions + parsedPriority;
}
