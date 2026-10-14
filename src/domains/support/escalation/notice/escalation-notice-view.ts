import { EscalationNotice } from "./escalation-notice.js";

/** How screens and exports show a escalation notice. */
export class EscalationNoticeView {
  codeText: string;
  title: string;
  budget: string;
  unit: string;
  summary: string;
  channelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    budget: string,
    unit: string,
    summary: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.budget = budget;
    this.unit = unit;
    this.summary = summary;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationNoticeView(item: EscalationNotice): EscalationNoticeView {
  return new EscalationNoticeView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    item.unit,
    item.summary,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationNoticeViews(items: EscalationNotice[]): EscalationNoticeView[] {
  const views: EscalationNoticeView[] = [];
  for (const item of items) {
    views.push(toEscalationNoticeView(item));
  }
  return views;
}

export function sumEscalationNoticeView(view: EscalationNoticeView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
