import * as text from "../../../../kit/text.js";
import { PathAgreement } from "./path-agreement.js";

/** How screens and exports show a path agreement. */
export class PathAgreementView {
  codeText: string;
  title: string;
  campaignRef: string;
  pinnedText: string;
  reviewer: string;
  cost: string;
  regionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    campaignRef: string,
    pinnedText: string,
    reviewer: string,
    cost: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.campaignRef = campaignRef;
    this.pinnedText = pinnedText;
    this.reviewer = reviewer;
    this.cost = cost;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toPathAgreementView(item: PathAgreement): PathAgreementView {
  return new PathAgreementView(
    item.code,
    item.title,
    text.truncate(item.campaignRef, 40),
    `${item.pinned}`,
    item.reviewer,
    item.cost.toFixed(2),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathAgreementViews(items: PathAgreement[]): PathAgreementView[] {
  const views: PathAgreementView[] = [];
  for (const item of items) {
    views.push(toPathAgreementView(item));
  }
  return views;
}

export function sumPathAgreementView(view: PathAgreementView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCost;
}
