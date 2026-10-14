import * as text from "../../../../kit/text.js";
import { PendingPacingTemplate } from "./pending-pacing-template.js";

/** How screens and exports show a pending pacing template. */
export class PendingPacingTemplateView {
  codeText: string;
  title: string;
  category: string;
  source: string;
  version: string;
  checksum: string;
  limitText: string;
  summary: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    category: string,
    source: string,
    version: string,
    checksum: string,
    limitText: string,
    summary: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.category = category;
    this.source = source;
    this.version = version;
    this.checksum = checksum;
    this.limitText = limitText;
    this.summary = summary;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPacingTemplateView(item: PendingPacingTemplate): PendingPacingTemplateView {
  return new PendingPacingTemplateView(
    item.code,
    item.title,
    item.category,
    text.truncate(item.source, 120),
    String(item.version),
    item.checksum,
    String(item.limit),
    item.summary,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPacingTemplateViews(items: PendingPacingTemplate[]): PendingPacingTemplateView[] {
  const views: PendingPacingTemplateView[] = [];
  for (const item of items) {
    views.push(toPendingPacingTemplateView(item));
  }
  return views;
}

export function sumPendingPacingTemplateView(view: PendingPacingTemplateView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedVersion + parsedLimit + parsedBudget;
}
