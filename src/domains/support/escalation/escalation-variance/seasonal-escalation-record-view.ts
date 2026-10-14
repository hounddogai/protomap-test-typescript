import * as text from "../../../../kit/text.js";
import { SeasonalEscalationRecord } from "./seasonal-escalation-record.js";

/** How screens and exports show a seasonal escalation record. */
export class SeasonalEscalationRecordView {
  codeText: string;
  title: string;
  locale: string;
  channelText: string;
  conversionRate: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    channelText: string,
    conversionRate: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.channelText = channelText;
    this.conversionRate = conversionRate;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalEscalationRecordView(item: SeasonalEscalationRecord): SeasonalEscalationRecordView {
  return new SeasonalEscalationRecordView(
    item.code,
    item.title,
    item.locale,
    text.truncate(item.channel, 120),
    item.conversionRate.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalEscalationRecordViews(items: SeasonalEscalationRecord[]): SeasonalEscalationRecordView[] {
  const views: SeasonalEscalationRecordView[] = [];
  for (const item of items) {
    views.push(toSeasonalEscalationRecordView(item));
  }
  return views;
}

export function sumSeasonalEscalationRecordView(view: SeasonalEscalationRecordView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedConversionRate + parsedOpenRate;
}
