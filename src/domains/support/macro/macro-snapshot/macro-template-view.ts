import * as text from "../../../../kit/text.js";
import { MacroTemplate } from "./macro-template.js";

/** How screens and exports show a macro template. */
export class MacroTemplateView {
  code: string;
  label: string;
  journeyIdText: string;
  sendAtText: string;
  graceDays: string;
  descriptionText: string;
  audienceIdText: string;
  startsAt: string;
  revision: string;
  segment: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    journeyIdText: string,
    sendAtText: string,
    graceDays: string,
    descriptionText: string,
    audienceIdText: string,
    startsAt: string,
    revision: string,
    segment: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.journeyIdText = journeyIdText;
    this.sendAtText = sendAtText;
    this.graceDays = graceDays;
    this.descriptionText = descriptionText;
    this.audienceIdText = audienceIdText;
    this.startsAt = startsAt;
    this.revision = revision;
    this.segment = segment;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toMacroTemplateView(item: MacroTemplate): MacroTemplateView {
  return new MacroTemplateView(
    item.code,
    text.truncate(item.label, 64),
    item.journeyId,
    String(item.sendAt),
    String(item.graceDays),
    item.description,
    item.audienceId,
    String(item.startsAt),
    String(item.revision),
    text.truncate(item.segment, 80),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroTemplateViews(items: MacroTemplate[]): MacroTemplateView[] {
  const views: MacroTemplateView[] = [];
  for (const item of items) {
    views.push(toMacroTemplateView(item));
  }
  return views;
}

export function sumMacroTemplateView(view: MacroTemplateView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedSendAt + parsedGraceDays + parsedStartsAt;
}
