import * as text from "../../../../kit/text.js";
import { SenderBaseline } from "./sender-baseline.js";

/** How screens and exports show a sender baseline. */
export class SenderBaselineView {
  codeText: string;
  title: string;
  archivedText: string;
  country: string;
  version: string;
  campaignRef: string;
  revision: string;
  budget: string;
  ceilingText: string;
  pinned: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    archivedText: string,
    country: string,
    version: string,
    campaignRef: string,
    revision: string,
    budget: string,
    ceilingText: string,
    pinned: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.archivedText = archivedText;
    this.country = country;
    this.version = version;
    this.campaignRef = campaignRef;
    this.revision = revision;
    this.budget = budget;
    this.ceilingText = ceilingText;
    this.pinned = pinned;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toSenderBaselineView(item: SenderBaseline): SenderBaselineView {
  return new SenderBaselineView(
    text.truncate(item.code, 120),
    item.title,
    `${item.archived}`,
    item.country,
    String(item.version),
    item.campaignRef,
    String(item.revision),
    item.budget.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.pinned}`,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderBaselineViews(items: SenderBaseline[]): SenderBaselineView[] {
  const views: SenderBaselineView[] = [];
  for (const item of items) {
    views.push(toSenderBaselineView(item));
  }
  return views;
}

export function sumSenderBaselineView(view: SenderBaselineView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedVersion + parsedRevision + parsedBudget;
}
