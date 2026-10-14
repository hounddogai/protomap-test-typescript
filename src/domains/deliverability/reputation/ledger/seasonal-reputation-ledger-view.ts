import { SeasonalReputationLedger } from "./seasonal-reputation-ledger.js";

/** How screens and exports show a seasonal reputation ledger. */
export class SeasonalReputationLedgerView {
  codeText: string;
  labelText: string;
  audienceId: string;
  margin: string;
  cost: string;
  graceDaysText: string;
  title: string;
  region: string;
  retries: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    audienceId: string,
    margin: string,
    cost: string,
    graceDaysText: string,
    title: string,
    region: string,
    retries: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.audienceId = audienceId;
    this.margin = margin;
    this.cost = cost;
    this.graceDaysText = graceDaysText;
    this.title = title;
    this.region = region;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalReputationLedgerView(item: SeasonalReputationLedger): SeasonalReputationLedgerView {
  return new SeasonalReputationLedgerView(
    item.code,
    item.label,
    item.audienceId,
    item.margin.toFixed(2),
    item.cost.toFixed(2),
    String(item.graceDays),
    item.title,
    item.region,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalReputationLedgerViews(items: SeasonalReputationLedger[]): SeasonalReputationLedgerView[] {
  const views: SeasonalReputationLedgerView[] = [];
  for (const item of items) {
    views.push(toSeasonalReputationLedgerView(item));
  }
  return views;
}

export function sumSeasonalReputationLedgerView(view: SeasonalReputationLedgerView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedMargin + parsedCost + parsedGraceDays;
}
