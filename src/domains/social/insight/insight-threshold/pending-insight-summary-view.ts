import * as text from "../../../../kit/text.js";
import { PendingInsightSummary } from "./pending-insight-summary.js";

/** How screens and exports show a pending insight summary. */
export class PendingInsightSummaryView {
  code: string;
  name: string;
  frequencyCap: string;
  title: string;
  localeText: string;
  approved: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    frequencyCap: string,
    title: string,
    localeText: string,
    approved: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.title = title;
    this.localeText = localeText;
    this.approved = approved;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toPendingInsightSummaryView(item: PendingInsightSummary): PendingInsightSummaryView {
  return new PendingInsightSummaryView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 80),
    String(item.frequencyCap),
    text.truncate(item.title, 80),
    item.locale,
    `${item.approved}`,
    text.truncate(item.journeyId, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingInsightSummaryViews(items: PendingInsightSummary[]): PendingInsightSummaryView[] {
  const views: PendingInsightSummaryView[] = [];
  for (const item of items) {
    views.push(toPendingInsightSummaryView(item));
  }
  return views;
}

export function sumPendingInsightSummaryView(view: PendingInsightSummaryView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedFrequencyCap;
}
