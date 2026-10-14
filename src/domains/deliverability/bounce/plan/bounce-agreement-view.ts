import * as text from "../../../../kit/text.js";
import { BounceAgreement } from "./bounce-agreement.js";

/** How screens and exports show a bounce agreement. */
export class BounceAgreementView {
  codeText: string;
  title: string;
  active: string;
  channelText: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    active: string,
    channelText: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.active = active;
    this.channelText = channelText;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toBounceAgreementView(item: BounceAgreement): BounceAgreementView {
  return new BounceAgreementView(
    item.code,
    item.title,
    `${item.active}`,
    text.truncate(item.channel, 80),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceAgreementViews(items: BounceAgreement[]): BounceAgreementView[] {
  const views: BounceAgreementView[] = [];
  for (const item of items) {
    views.push(toBounceAgreementView(item));
  }
  return views;
}

export function sumBounceAgreementView(view: BounceAgreementView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedUpdatedAt;
}
