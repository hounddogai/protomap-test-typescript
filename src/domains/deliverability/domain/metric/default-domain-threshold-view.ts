import * as text from "../../../../kit/text.js";
import { DefaultDomainThreshold } from "./default-domain-threshold.js";

/** How screens and exports show a default domain threshold. */
export class DefaultDomainThresholdView {
  codeText: string;
  titleText: string;
  externalRefText: string;
  approvedText: string;
  journeyId: string;
  endsAtText: string;
  startsAt: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    externalRefText: string,
    approvedText: string,
    journeyId: string,
    endsAtText: string,
    startsAt: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.externalRefText = externalRefText;
    this.approvedText = approvedText;
    this.journeyId = journeyId;
    this.endsAtText = endsAtText;
    this.startsAt = startsAt;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultDomainThresholdView(item: DefaultDomainThreshold): DefaultDomainThresholdView {
  return new DefaultDomainThresholdView(
    item.code,
    item.title,
    text.truncate(item.externalRef, 64),
    `${item.approved}`,
    text.truncate(item.journeyId, 80),
    String(item.endsAt),
    String(item.startsAt),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultDomainThresholdViews(items: DefaultDomainThreshold[]): DefaultDomainThresholdView[] {
  const views: DefaultDomainThresholdView[] = [];
  for (const item of items) {
    views.push(toDefaultDomainThresholdView(item));
  }
  return views;
}

export function sumDefaultDomainThresholdView(view: DefaultDomainThresholdView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedEndsAt + parsedStartsAt + parsedMaximum;
}
