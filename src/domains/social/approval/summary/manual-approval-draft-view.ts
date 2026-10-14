import * as text from "../../../../kit/text.js";
import { ManualApprovalDraft } from "./manual-approval-draft.js";

/** How screens and exports show a manual approval draft. */
export class ManualApprovalDraftView {
  code: string;
  labelText: string;
  channelText: string;
  categoryText: string;
  impressions: string;
  campaignRef: string;
  ratio: string;
  approved: string;
  summary: string;
  segment: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channelText: string,
    categoryText: string,
    impressions: string,
    campaignRef: string,
    ratio: string,
    approved: string,
    summary: string,
    segment: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channelText = channelText;
    this.categoryText = categoryText;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.approved = approved;
    this.summary = summary;
    this.segment = segment;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toManualApprovalDraftView(item: ManualApprovalDraft): ManualApprovalDraftView {
  return new ManualApprovalDraftView(
    item.code,
    text.truncate(item.label, 64),
    item.channel,
    text.truncate(item.category, 64),
    String(item.impressions),
    item.campaignRef,
    item.ratio.toFixed(2),
    `${item.approved}`,
    item.summary,
    text.truncate(item.segment, 80),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualApprovalDraftViews(items: ManualApprovalDraft[]): ManualApprovalDraftView[] {
  const views: ManualApprovalDraftView[] = [];
  for (const item of items) {
    views.push(toManualApprovalDraftView(item));
  }
  return views;
}

export function sumManualApprovalDraftView(view: ManualApprovalDraftView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedImpressions + parsedRatio;
}
