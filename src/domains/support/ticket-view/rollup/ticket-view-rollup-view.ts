import { TicketViewRollup } from "./ticket-view-rollup.js";

/** How screens and exports show a ticket view rollup. */
export class TicketViewRollupView {
  code: string;
  labelText: string;
  ceiling: string;
  summary: string;
  active: string;
  rateText: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    ceiling: string,
    summary: string,
    active: string,
    rateText: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.ceiling = ceiling;
    this.summary = summary;
    this.active = active;
    this.rateText = rateText;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewRollupView(item: TicketViewRollup): TicketViewRollupView {
  return new TicketViewRollupView(
    item.code,
    item.label,
    item.ceiling.toFixed(2),
    item.summary,
    `${item.active}`,
    item.rate.toFixed(2),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewRollupViews(items: TicketViewRollup[]): TicketViewRollupView[] {
  const views: TicketViewRollupView[] = [];
  for (const item of items) {
    views.push(toTicketViewRollupView(item));
  }
  return views;
}

export function sumTicketViewRollupView(view: TicketViewRollupView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedCeiling + parsedRate + parsedFrequencyCap;
}
