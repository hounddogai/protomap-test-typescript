import * as text from "../../../../kit/text.js";
import { BranchTemplate } from "./branch-template.js";

/** How screens and exports show a branch template. */
export class BranchTemplateView {
  code: string;
  name: string;
  floorValue: string;
  revision: string;
  cohortText: string;
  startsAt: string;
  batchSize: string;
  campaignRefText: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    floorValue: string,
    revision: string,
    cohortText: string,
    startsAt: string,
    batchSize: string,
    campaignRefText: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.revision = revision;
    this.cohortText = cohortText;
    this.startsAt = startsAt;
    this.batchSize = batchSize;
    this.campaignRefText = campaignRefText;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toBranchTemplateView(item: BranchTemplate): BranchTemplateView {
  return new BranchTemplateView(
    item.code,
    text.truncate(item.name, 64),
    item.floorValue.toFixed(2),
    String(item.revision),
    item.cohort,
    String(item.startsAt),
    String(item.batchSize),
    item.campaignRef,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchTemplateViews(items: BranchTemplate[]): BranchTemplateView[] {
  const views: BranchTemplateView[] = [];
  for (const item of items) {
    views.push(toBranchTemplateView(item));
  }
  return views;
}

export function sumBranchTemplateView(view: BranchTemplateView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedFloorValue + parsedRevision + parsedStartsAt;
}
