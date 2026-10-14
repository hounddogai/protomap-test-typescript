import * as text from "../../../../kit/text.js";
import { GlobalSenderRequest } from "./global-sender-request.js";

/** How screens and exports show a global sender request. */
export class GlobalSenderRequestView {
  code: string;
  nameText: string;
  label: string;
  openRateText: string;
  titleText: string;
  version: string;
  phoneText: string;
  cohortText: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    label: string,
    openRateText: string,
    titleText: string,
    version: string,
    phoneText: string,
    cohortText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.label = label;
    this.openRateText = openRateText;
    this.titleText = titleText;
    this.version = version;
    this.phoneText = phoneText;
    this.cohortText = cohortText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSenderRequestView(item: GlobalSenderRequest): GlobalSenderRequestView {
  return new GlobalSenderRequestView(
    item.code,
    text.truncate(item.name, 80),
    item.label,
    item.openRate.toFixed(2),
    item.title,
    String(item.version),
    item.phone,
    item.cohort,
    text.truncate(item.summary, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSenderRequestViews(items: GlobalSenderRequest[]): GlobalSenderRequestView[] {
  const views: GlobalSenderRequestView[] = [];
  for (const item of items) {
    views.push(toGlobalSenderRequestView(item));
  }
  return views;
}

export function sumGlobalSenderRequestView(view: GlobalSenderRequestView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedOpenRate + parsedVersion;
}
