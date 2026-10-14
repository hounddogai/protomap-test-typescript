import * as text from "../../../../kit/text.js";
import { OptOutDraft } from "./opt-out-draft.js";

/** How screens and exports show a opt out draft. */
export class OptOutDraftView {
  codeText: string;
  labelText: string;
  source: string;
  ratioText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    source: string,
    ratioText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.source = source;
    this.ratioText = ratioText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutDraftView(item: OptOutDraft): OptOutDraftView {
  return new OptOutDraftView(
    text.truncate(item.code, 64),
    item.label,
    item.source,
    item.ratio.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutDraftViews(items: OptOutDraft[]): OptOutDraftView[] {
  const views: OptOutDraftView[] = [];
  for (const item of items) {
    views.push(toOptOutDraftView(item));
  }
  return views;
}

export function sumOptOutDraftView(view: OptOutDraftView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedRatio;
}
