import * as text from "../../../../kit/text.js";
import { NudgeTemplate } from "./nudge-template.js";

/** How screens and exports show a nudge template. */
export class NudgeTemplateView {
  code: string;
  name: string;
  campaignRefText: string;
  sequence: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRefText: string,
    sequence: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRefText = campaignRefText;
    this.sequence = sequence;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeTemplateView(item: NudgeTemplate): NudgeTemplateView {
  return new NudgeTemplateView(
    item.code,
    text.truncate(item.name, 80),
    item.campaignRef,
    String(item.sequence),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeTemplateViews(items: NudgeTemplate[]): NudgeTemplateView[] {
  const views: NudgeTemplateView[] = [];
  for (const item of items) {
    views.push(toNudgeTemplateView(item));
  }
  return views;
}

export function sumNudgeTemplateView(view: NudgeTemplateView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedSequence + parsedGraceDays;
}
