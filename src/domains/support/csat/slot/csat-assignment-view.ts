import * as text from "../../../../kit/text.js";
import { CsatAssignment } from "./csat-assignment.js";

/** How screens and exports show a csat assignment. */
export class CsatAssignmentView {
  code: string;
  name: string;
  createdAtText: string;
  clicksText: string;
  visible: string;
  startsAt: string;
  rate: string;
  source: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    createdAtText: string,
    clicksText: string,
    visible: string,
    startsAt: string,
    rate: string,
    source: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.createdAtText = createdAtText;
    this.clicksText = clicksText;
    this.visible = visible;
    this.startsAt = startsAt;
    this.rate = rate;
    this.source = source;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toCsatAssignmentView(item: CsatAssignment): CsatAssignmentView {
  return new CsatAssignmentView(
    item.code,
    text.truncate(item.name, 40),
    String(item.createdAt),
    String(item.clicks),
    `${item.visible}`,
    String(item.startsAt),
    item.rate.toFixed(2),
    item.source,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatAssignmentViews(items: CsatAssignment[]): CsatAssignmentView[] {
  const views: CsatAssignmentView[] = [];
  for (const item of items) {
    views.push(toCsatAssignmentView(item));
  }
  return views;
}

export function sumCsatAssignmentView(view: CsatAssignmentView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedCreatedAt + parsedClicks + parsedStartsAt;
}
