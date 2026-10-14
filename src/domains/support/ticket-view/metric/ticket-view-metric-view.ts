import * as text from "../../../../kit/text.js";
import { TicketViewMetric } from "./ticket-view-metric.js";

/** How screens and exports show a ticket view metric. */
export class TicketViewMetricView {
  code: string;
  titleText: string;
  notes: string;
  activeText: string;
  revision: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    notes: string,
    activeText: string,
    revision: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.notes = notes;
    this.activeText = activeText;
    this.revision = revision;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewMetricView(item: TicketViewMetric): TicketViewMetricView {
  return new TicketViewMetricView(
    item.code,
    text.truncate(item.title, 120),
    text.truncate(item.notes, 40),
    `${item.active}`,
    String(item.revision),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewMetricViews(items: TicketViewMetric[]): TicketViewMetricView[] {
  const views: TicketViewMetricView[] = [];
  for (const item of items) {
    views.push(toTicketViewMetricView(item));
  }
  return views;
}

export function sumTicketViewMetricView(view: TicketViewMetricView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedRevision + parsedSendAt;
}
