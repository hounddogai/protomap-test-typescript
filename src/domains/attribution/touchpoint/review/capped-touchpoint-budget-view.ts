import { CappedTouchpointBudget } from "./capped-touchpoint-budget.js";

/** How screens and exports show a capped touchpoint budget. */
export class CappedTouchpointBudgetView {
  code: string;
  name: string;
  contactEmail: string;
  checksum: string;
  labelText: string;
  clicks: string;
  sequence: string;
  countryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    checksum: string,
    labelText: string,
    clicks: string,
    sequence: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.labelText = labelText;
    this.clicks = clicks;
    this.sequence = sequence;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedTouchpointBudgetView(item: CappedTouchpointBudget): CappedTouchpointBudgetView {
  return new CappedTouchpointBudgetView(
    item.code,
    item.name,
    item.contactEmail,
    item.checksum,
    item.label,
    String(item.clicks),
    String(item.sequence),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedTouchpointBudgetViews(items: CappedTouchpointBudget[]): CappedTouchpointBudgetView[] {
  const views: CappedTouchpointBudgetView[] = [];
  for (const item of items) {
    views.push(toCappedTouchpointBudgetView(item));
  }
  return views;
}

export function sumCappedTouchpointBudgetView(view: CappedTouchpointBudgetView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedClicks + parsedSequence;
}
