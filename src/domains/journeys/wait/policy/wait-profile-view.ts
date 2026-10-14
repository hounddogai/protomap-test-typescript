import * as text from "../../../../kit/text.js";
import { WaitProfile } from "./wait-profile.js";

/** How screens and exports show a wait profile. */
export class WaitProfileView {
  code: string;
  name: string;
  margin: string;
  weight: string;
  clicks: string;
  threshold: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    margin: string,
    weight: string,
    clicks: string,
    threshold: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.weight = weight;
    this.clicks = clicks;
    this.threshold = threshold;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toWaitProfileView(item: WaitProfile): WaitProfileView {
  return new WaitProfileView(
    text.truncate(item.code, 64),
    item.name,
    item.margin.toFixed(2),
    item.weight.toFixed(2),
    String(item.clicks),
    item.threshold.toFixed(2),
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitProfileViews(items: WaitProfile[]): WaitProfileView[] {
  const views: WaitProfileView[] = [];
  for (const item of items) {
    views.push(toWaitProfileView(item));
  }
  return views;
}

export function sumWaitProfileView(view: WaitProfileView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedMargin + parsedWeight + parsedClicks;
}
