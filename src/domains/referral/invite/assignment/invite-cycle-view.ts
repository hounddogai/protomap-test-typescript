import * as text from "../../../../kit/text.js";
import { InviteCycle } from "./invite-cycle.js";

/** How screens and exports show a invite cycle. */
export class InviteCycleView {
  code: string;
  labelText: string;
  journeyId: string;
  reviewer: string;
  frequencyCap: string;
  name: string;
  variant: string;
  countryText: string;
  version: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    journeyId: string,
    reviewer: string,
    frequencyCap: string,
    name: string,
    variant: string,
    countryText: string,
    version: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
    this.name = name;
    this.variant = variant;
    this.countryText = countryText;
    this.version = version;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toInviteCycleView(item: InviteCycle): InviteCycleView {
  return new InviteCycleView(
    text.truncate(item.code, 120),
    item.label,
    item.journeyId,
    item.reviewer,
    String(item.frequencyCap),
    text.truncate(item.name, 40),
    item.variant,
    item.country,
    String(item.version),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteCycleViews(items: InviteCycle[]): InviteCycleView[] {
  const views: InviteCycleView[] = [];
  for (const item of items) {
    views.push(toInviteCycleView(item));
  }
  return views;
}

export function sumInviteCycleView(view: InviteCycleView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedFrequencyCap + parsedVersion + parsedOpenRate;
}
