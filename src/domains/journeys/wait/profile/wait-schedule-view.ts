import * as text from "../../../../kit/text.js";
import { WaitSchedule } from "./wait-schedule.js";

/** How screens and exports show a wait schedule. */
export class WaitScheduleView {
  code: string;
  nameText: string;
  floorValue: string;
  utmSource: string;
  version: string;
  weight: string;
  channel: string;
  region: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    floorValue: string,
    utmSource: string,
    version: string,
    weight: string,
    channel: string,
    region: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.floorValue = floorValue;
    this.utmSource = utmSource;
    this.version = version;
    this.weight = weight;
    this.channel = channel;
    this.region = region;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toWaitScheduleView(item: WaitSchedule): WaitScheduleView {
  return new WaitScheduleView(
    item.code,
    item.name,
    item.floorValue.toFixed(2),
    text.truncate(item.utmSource, 40),
    String(item.version),
    item.weight.toFixed(2),
    text.truncate(item.channel, 120),
    item.region,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitScheduleViews(items: WaitSchedule[]): WaitScheduleView[] {
  const views: WaitScheduleView[] = [];
  for (const item of items) {
    views.push(toWaitScheduleView(item));
  }
  return views;
}

export function sumWaitScheduleView(view: WaitScheduleView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedFloorValue + parsedVersion + parsedWeight;
}
