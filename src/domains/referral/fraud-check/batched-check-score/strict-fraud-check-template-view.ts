import * as text from "../../../../kit/text.js";
import { StrictFraudCheckTemplate } from "./strict-fraud-check-template.js";

/** How screens and exports show a strict fraud check template. */
export class StrictFraudCheckTemplateView {
  code: string;
  title: string;
  visible: string;
  journeyIdText: string;
  regionText: string;
  channel: string;
  reviewer: string;
  summary: string;
  revision: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    visible: string,
    journeyIdText: string,
    regionText: string,
    channel: string,
    reviewer: string,
    summary: string,
    revision: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.journeyIdText = journeyIdText;
    this.regionText = regionText;
    this.channel = channel;
    this.reviewer = reviewer;
    this.summary = summary;
    this.revision = revision;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFraudCheckTemplateView(item: StrictFraudCheckTemplate): StrictFraudCheckTemplateView {
  return new StrictFraudCheckTemplateView(
    item.code,
    item.title,
    `${item.visible}`,
    text.truncate(item.journeyId, 40),
    item.region,
    item.channel,
    item.reviewer,
    item.summary,
    String(item.revision),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFraudCheckTemplateViews(items: StrictFraudCheckTemplate[]): StrictFraudCheckTemplateView[] {
  const views: StrictFraudCheckTemplateView[] = [];
  for (const item of items) {
    views.push(toStrictFraudCheckTemplateView(item));
  }
  return views;
}

export function sumStrictFraudCheckTemplateView(view: StrictFraudCheckTemplateView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
