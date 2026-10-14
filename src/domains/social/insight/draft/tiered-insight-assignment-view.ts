import * as text from "../../../../kit/text.js";
import { TieredInsightAssignment } from "./tiered-insight-assignment.js";

/** How screens and exports show a tiered insight assignment. */
export class TieredInsightAssignmentView {
  codeText: string;
  title: string;
  contactEmail: string;
  sourceText: string;
  campaignRef: string;
  nameText: string;
  version: string;
  segment: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    contactEmail: string,
    sourceText: string,
    campaignRef: string,
    nameText: string,
    version: string,
    segment: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.contactEmail = contactEmail;
    this.sourceText = sourceText;
    this.campaignRef = campaignRef;
    this.nameText = nameText;
    this.version = version;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toTieredInsightAssignmentView(item: TieredInsightAssignment): TieredInsightAssignmentView {
  return new TieredInsightAssignmentView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 120),
    item.contactEmail,
    text.truncate(item.source, 40),
    item.campaignRef,
    text.truncate(item.name, 64),
    String(item.version),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredInsightAssignmentViews(items: TieredInsightAssignment[]): TieredInsightAssignmentView[] {
  const views: TieredInsightAssignmentView[] = [];
  for (const item of items) {
    views.push(toTieredInsightAssignmentView(item));
  }
  return views;
}

export function sumTieredInsightAssignmentView(view: TieredInsightAssignmentView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedVersion;
}
