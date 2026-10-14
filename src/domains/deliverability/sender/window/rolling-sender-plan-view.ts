import * as text from "../../../../kit/text.js";
import { RollingSenderPlan } from "./rolling-sender-plan.js";

/** How screens and exports show a rolling sender plan. */
export class RollingSenderPlanView {
  code: string;
  titleText: string;
  revision: string;
  rate: string;
  timezone: string;
  notesText: string;
  category: string;
  startsAt: string;
  label: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revision: string,
    rate: string,
    timezone: string,
    notesText: string,
    category: string,
    startsAt: string,
    label: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revision = revision;
    this.rate = rate;
    this.timezone = timezone;
    this.notesText = notesText;
    this.category = category;
    this.startsAt = startsAt;
    this.label = label;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSenderPlanView(item: RollingSenderPlan): RollingSenderPlanView {
  return new RollingSenderPlanView(
    item.code,
    item.title,
    String(item.revision),
    item.rate.toFixed(2),
    text.truncate(item.timezone, 120),
    text.truncate(item.notes, 40),
    item.category,
    String(item.startsAt),
    item.label,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSenderPlanViews(items: RollingSenderPlan[]): RollingSenderPlanView[] {
  const views: RollingSenderPlanView[] = [];
  for (const item of items) {
    views.push(toRollingSenderPlanView(item));
  }
  return views;
}

export function sumRollingSenderPlanView(view: RollingSenderPlanView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedRevision + parsedRate + parsedStartsAt;
}
