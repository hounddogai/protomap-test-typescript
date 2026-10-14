import * as text from "../../../../kit/text.js";
import { ManualEscalationLedger } from "./manual-escalation-ledger.js";

/** How screens and exports show a manual escalation ledger. */
export class ManualEscalationLedgerView {
  code: string;
  label: string;
  visible: string;
  floorValue: string;
  windowDays: string;
  budget: string;
  clicksText: string;
  margin: string;
  categoryText: string;
  archivedText: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visible: string,
    floorValue: string,
    windowDays: string,
    budget: string,
    clicksText: string,
    margin: string,
    categoryText: string,
    archivedText: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.budget = budget;
    this.clicksText = clicksText;
    this.margin = margin;
    this.categoryText = categoryText;
    this.archivedText = archivedText;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toManualEscalationLedgerView(item: ManualEscalationLedger): ManualEscalationLedgerView {
  return new ManualEscalationLedgerView(
    item.code,
    text.truncate(item.label, 64),
    `${item.visible}`,
    item.floorValue.toFixed(2),
    String(item.windowDays),
    item.budget.toFixed(2),
    String(item.clicks),
    item.margin.toFixed(2),
    item.category,
    `${item.archived}`,
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualEscalationLedgerViews(items: ManualEscalationLedger[]): ManualEscalationLedgerView[] {
  const views: ManualEscalationLedgerView[] = [];
  for (const item of items) {
    views.push(toManualEscalationLedgerView(item));
  }
  return views;
}

export function sumManualEscalationLedgerView(view: ManualEscalationLedgerView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedFloorValue + parsedWindowDays + parsedBudget;
}
