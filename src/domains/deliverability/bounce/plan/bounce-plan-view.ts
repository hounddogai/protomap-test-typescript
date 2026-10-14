import * as text from "../../../../kit/text.js";
import { BouncePlan } from "./bounce-plan.js";

/** How screens and exports show a bounce plan. */
export class BouncePlanView {
  codeText: string;
  nameText: string;
  cohort: string;
  capacity: string;
  active: string;
  frequencyCap: string;
  categoryText: string;
  channelText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    cohort: string,
    capacity: string,
    active: string,
    frequencyCap: string,
    categoryText: string,
    channelText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.cohort = cohort;
    this.capacity = capacity;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.categoryText = categoryText;
    this.channelText = channelText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toBouncePlanView(item: BouncePlan): BouncePlanView {
  return new BouncePlanView(
    text.truncate(item.code, 120),
    item.name,
    item.cohort,
    String(item.capacity),
    `${item.active}`,
    String(item.frequencyCap),
    text.truncate(item.category, 64),
    item.channel,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toBouncePlanViews(items: BouncePlan[]): BouncePlanView[] {
  const views: BouncePlanView[] = [];
  for (const item of items) {
    views.push(toBouncePlanView(item));
  }
  return views;
}

export function sumBouncePlanView(view: BouncePlanView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedCapacity + parsedFrequencyCap;
}
