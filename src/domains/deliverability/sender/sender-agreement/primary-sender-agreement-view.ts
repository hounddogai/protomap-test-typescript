import { PrimarySenderAgreement } from "./primary-sender-agreement.js";

/** How screens and exports show a primary sender agreement. */
export class PrimarySenderAgreementView {
  code: string;
  name: string;
  priority: string;
  clicks: string;
  label: string;
  statusLabel: string;

  constructor(code: string, name: string, priority: string, clicks: string, label: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.clicks = clicks;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySenderAgreementView(item: PrimarySenderAgreement): PrimarySenderAgreementView {
  return new PrimarySenderAgreementView(
    item.code,
    item.name,
    String(item.priority),
    String(item.clicks),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySenderAgreementViews(items: PrimarySenderAgreement[]): PrimarySenderAgreementView[] {
  const views: PrimarySenderAgreementView[] = [];
  for (const item of items) {
    views.push(toPrimarySenderAgreementView(item));
  }
  return views;
}

export function sumPrimarySenderAgreementView(view: PrimarySenderAgreementView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedPriority + parsedClicks;
}
