import * as text from "../../../../kit/text.js";
import { TouchpointNotice } from "./touchpoint-notice.js";

/** How screens and exports show a touchpoint notice. */
export class TouchpointNoticeView {
  code: string;
  name: string;
  createdAt: string;
  category: string;
  reviewer: string;
  budgetText: string;
  journeyId: string;
  revisionText: string;
  sequenceText: string;
  minimum: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    createdAt: string,
    category: string,
    reviewer: string,
    budgetText: string,
    journeyId: string,
    revisionText: string,
    sequenceText: string,
    minimum: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.category = category;
    this.reviewer = reviewer;
    this.budgetText = budgetText;
    this.journeyId = journeyId;
    this.revisionText = revisionText;
    this.sequenceText = sequenceText;
    this.minimum = minimum;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointNoticeView(item: TouchpointNotice): TouchpointNoticeView {
  return new TouchpointNoticeView(
    item.code,
    item.name,
    String(item.createdAt),
    item.category,
    text.truncate(item.reviewer, 80),
    item.budget.toFixed(2),
    item.journeyId,
    String(item.revision),
    String(item.sequence),
    item.minimum.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointNoticeViews(items: TouchpointNotice[]): TouchpointNoticeView[] {
  const views: TouchpointNoticeView[] = [];
  for (const item of items) {
    views.push(toTouchpointNoticeView(item));
  }
  return views;
}

export function sumTouchpointNoticeView(view: TouchpointNoticeView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedCreatedAt + parsedBudget + parsedRevision;
}
