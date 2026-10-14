import * as text from "../../../../kit/text.js";
import { DefaultTicketViewNotice } from "./default-ticket-view-notice.js";

/** How screens and exports show a default ticket view notice. */
export class DefaultTicketViewNoticeView {
  code: string;
  name: string;
  checksumText: string;
  ceilingText: string;
  ratioText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    checksumText: string,
    ceilingText: string,
    ratioText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.checksumText = checksumText;
    this.ceilingText = ceilingText;
    this.ratioText = ratioText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultTicketViewNoticeView(item: DefaultTicketViewNotice): DefaultTicketViewNoticeView {
  return new DefaultTicketViewNoticeView(
    text.truncate(item.code, 40),
    item.name,
    item.checksum,
    item.ceiling.toFixed(2),
    item.ratio.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultTicketViewNoticeViews(items: DefaultTicketViewNotice[]): DefaultTicketViewNoticeView[] {
  const views: DefaultTicketViewNoticeView[] = [];
  for (const item of items) {
    views.push(toDefaultTicketViewNoticeView(item));
  }
  return views;
}

export function sumDefaultTicketViewNoticeView(view: DefaultTicketViewNoticeView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedCeiling + parsedRatio + parsedBudget;
}
