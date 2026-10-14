import * as text from "../../../../kit/text.js";
import { LegacyPlacementAudit } from "./legacy-placement-audit.js";

/** How screens and exports show a legacy placement audit. */
export class LegacyPlacementAuditView {
  code: string;
  labelText: string;
  cohort: string;
  journeyIdText: string;
  phoneText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    cohort: string,
    journeyIdText: string,
    phoneText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.cohort = cohort;
    this.journeyIdText = journeyIdText;
    this.phoneText = phoneText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPlacementAuditView(item: LegacyPlacementAudit): LegacyPlacementAuditView {
  return new LegacyPlacementAuditView(
    item.code,
    item.label,
    text.truncate(item.cohort, 80),
    item.journeyId,
    item.phone,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPlacementAuditViews(items: LegacyPlacementAudit[]): LegacyPlacementAuditView[] {
  const views: LegacyPlacementAuditView[] = [];
  for (const item of items) {
    views.push(toLegacyPlacementAuditView(item));
  }
  return views;
}

export function sumLegacyPlacementAuditView(view: LegacyPlacementAuditView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
