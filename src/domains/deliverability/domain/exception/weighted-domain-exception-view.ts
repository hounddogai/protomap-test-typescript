import * as text from "../../../../kit/text.js";
import { WeightedDomainException } from "./weighted-domain-exception.js";

/** How screens and exports show a weighted domain exception. */
export class WeightedDomainExceptionView {
  codeText: string;
  titleText: string;
  audienceId: string;
  unitText: string;
  durationMinutes: string;
  updatedAt: string;
  rate: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    audienceId: string,
    unitText: string,
    durationMinutes: string,
    updatedAt: string,
    rate: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.audienceId = audienceId;
    this.unitText = unitText;
    this.durationMinutes = durationMinutes;
    this.updatedAt = updatedAt;
    this.rate = rate;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedDomainExceptionView(item: WeightedDomainException): WeightedDomainExceptionView {
  return new WeightedDomainExceptionView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    item.audienceId,
    text.truncate(item.unit, 80),
    String(item.durationMinutes),
    String(item.updatedAt),
    item.rate.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedDomainExceptionViews(items: WeightedDomainException[]): WeightedDomainExceptionView[] {
  const views: WeightedDomainExceptionView[] = [];
  for (const item of items) {
    views.push(toWeightedDomainExceptionView(item));
  }
  return views;
}

export function sumWeightedDomainExceptionView(view: WeightedDomainExceptionView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedDurationMinutes + parsedUpdatedAt + parsedRate;
}
