import * as text from "../../../../kit/text.js";
import { LenientSuppressionException } from "./lenient-suppression-exception.js";

/** How screens and exports show a lenient suppression exception. */
export class LenientSuppressionExceptionView {
  code: string;
  titleText: string;
  description: string;
  journeyId: string;
  endsAtText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    description: string,
    journeyId: string,
    endsAtText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.description = description;
    this.journeyId = journeyId;
    this.endsAtText = endsAtText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toLenientSuppressionExceptionView(item: LenientSuppressionException): LenientSuppressionExceptionView {
  return new LenientSuppressionExceptionView(
    text.truncate(item.code, 40),
    item.title,
    text.truncate(item.description, 120),
    item.journeyId,
    String(item.endsAt),
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientSuppressionExceptionViews(items: LenientSuppressionException[]): LenientSuppressionExceptionView[] {
  const views: LenientSuppressionExceptionView[] = [];
  for (const item of items) {
    views.push(toLenientSuppressionExceptionView(item));
  }
  return views;
}

export function sumLenientSuppressionExceptionView(view: LenientSuppressionExceptionView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedEndsAt;
}
