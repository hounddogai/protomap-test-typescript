import * as text from "../../../../kit/text.js";
import { PendingNudgeTemplate } from "./pending-nudge-template.js";

/** How screens and exports show a pending nudge template. */
export class PendingNudgeTemplateView {
  code: string;
  title: string;
  audienceId: string;
  impressions: string;
  localeText: string;
  openRate: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    impressions: string,
    localeText: string,
    openRate: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.impressions = impressions;
    this.localeText = localeText;
    this.openRate = openRate;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toPendingNudgeTemplateView(item: PendingNudgeTemplate): PendingNudgeTemplateView {
  return new PendingNudgeTemplateView(
    item.code,
    item.title,
    text.truncate(item.audienceId, 64),
    String(item.impressions),
    item.locale,
    item.openRate.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingNudgeTemplateViews(items: PendingNudgeTemplate[]): PendingNudgeTemplateView[] {
  const views: PendingNudgeTemplateView[] = [];
  for (const item of items) {
    views.push(toPendingNudgeTemplateView(item));
  }
  return views;
}

export function sumPendingNudgeTemplateView(view: PendingNudgeTemplateView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedImpressions + parsedOpenRate;
}
