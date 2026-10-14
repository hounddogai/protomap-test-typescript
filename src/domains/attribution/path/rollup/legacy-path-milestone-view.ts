import * as text from "../../../../kit/text.js";
import { LegacyPathMilestone } from "./legacy-path-milestone.js";

/** How screens and exports show a legacy path milestone. */
export class LegacyPathMilestoneView {
  code: string;
  name: string;
  revision: string;
  rateText: string;
  contactEmail: string;
  reviewer: string;
  retries: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revision: string,
    rateText: string,
    contactEmail: string,
    reviewer: string,
    retries: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.rateText = rateText;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.retries = retries;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPathMilestoneView(item: LegacyPathMilestone): LegacyPathMilestoneView {
  return new LegacyPathMilestoneView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 40),
    String(item.revision),
    item.rate.toFixed(2),
    text.truncate(item.contactEmail, 40),
    text.truncate(item.reviewer, 120),
    String(item.retries),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPathMilestoneViews(items: LegacyPathMilestone[]): LegacyPathMilestoneView[] {
  const views: LegacyPathMilestoneView[] = [];
  for (const item of items) {
    views.push(toLegacyPathMilestoneView(item));
  }
  return views;
}

export function sumLegacyPathMilestoneView(view: LegacyPathMilestoneView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedRevision + parsedRate + parsedRetries;
}
