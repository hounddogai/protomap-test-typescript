import * as text from "../../../../kit/text.js";
import { PacingThreshold } from "./pacing-threshold.js";

/** How screens and exports show a pacing threshold. */
export class PacingThresholdView {
  code: string;
  name: string;
  updatedAtText: string;
  title: string;
  capacity: string;
  phone: string;
  limitText: string;
  visibleText: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAtText: string,
    title: string,
    capacity: string,
    phone: string,
    limitText: string,
    visibleText: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAtText = updatedAtText;
    this.title = title;
    this.capacity = capacity;
    this.phone = phone;
    this.limitText = limitText;
    this.visibleText = visibleText;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toPacingThresholdView(item: PacingThreshold): PacingThresholdView {
  return new PacingThresholdView(
    item.code,
    text.truncate(item.name, 40),
    String(item.updatedAt),
    text.truncate(item.title, 64),
    String(item.capacity),
    text.truncate(item.phone, 80),
    String(item.limit),
    `${item.visible}`,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingThresholdViews(items: PacingThreshold[]): PacingThresholdView[] {
  const views: PacingThresholdView[] = [];
  for (const item of items) {
    views.push(toPacingThresholdView(item));
  }
  return views;
}

export function sumPacingThresholdView(view: PacingThresholdView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedUpdatedAt + parsedCapacity + parsedLimit;
}
