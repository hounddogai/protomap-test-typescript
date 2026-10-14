import * as text from "../../../../kit/text.js";
import { StepGroup } from "./step-group.js";

/** How screens and exports show a step group. */
export class StepGroupView {
  codeText: string;
  label: string;
  locale: string;
  weight: string;
  createdAt: string;
  channel: string;
  archivedText: string;
  frequencyCap: string;
  contactEmail: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    locale: string,
    weight: string,
    createdAt: string,
    channel: string,
    archivedText: string,
    frequencyCap: string,
    contactEmail: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.locale = locale;
    this.weight = weight;
    this.createdAt = createdAt;
    this.channel = channel;
    this.archivedText = archivedText;
    this.frequencyCap = frequencyCap;
    this.contactEmail = contactEmail;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toStepGroupView(item: StepGroup): StepGroupView {
  return new StepGroupView(
    text.truncate(item.code, 40),
    item.label,
    text.truncate(item.locale, 80),
    item.weight.toFixed(2),
    String(item.createdAt),
    text.truncate(item.channel, 40),
    `${item.archived}`,
    String(item.frequencyCap),
    item.contactEmail,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepGroupViews(items: StepGroup[]): StepGroupView[] {
  const views: StepGroupView[] = [];
  for (const item of items) {
    views.push(toStepGroupView(item));
  }
  return views;
}

export function sumStepGroupView(view: StepGroupView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedWeight + parsedCreatedAt + parsedFrequencyCap;
}
