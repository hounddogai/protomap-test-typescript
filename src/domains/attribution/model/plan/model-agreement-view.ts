import * as text from "../../../../kit/text.js";
import { ModelAgreement } from "./model-agreement.js";

/** How screens and exports show a model agreement. */
export class ModelAgreementView {
  codeText: string;
  title: string;
  campaignRefText: string;
  openRate: string;
  locale: string;
  phone: string;
  channel: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    campaignRefText: string,
    openRate: string,
    locale: string,
    phone: string,
    channel: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.campaignRefText = campaignRefText;
    this.openRate = openRate;
    this.locale = locale;
    this.phone = phone;
    this.channel = channel;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toModelAgreementView(item: ModelAgreement): ModelAgreementView {
  return new ModelAgreementView(
    item.code,
    text.truncate(item.title, 64),
    item.campaignRef,
    item.openRate.toFixed(2),
    item.locale,
    item.phone,
    item.channel,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelAgreementViews(items: ModelAgreement[]): ModelAgreementView[] {
  const views: ModelAgreementView[] = [];
  for (const item of items) {
    views.push(toModelAgreementView(item));
  }
  return views;
}

export function sumModelAgreementView(view: ModelAgreementView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedOpenRate + parsedMargin;
}
