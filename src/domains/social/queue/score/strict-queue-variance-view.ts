import * as text from "../../../../kit/text.js";
import { StrictQueueVariance } from "./strict-queue-variance.js";

/** How screens and exports show a strict queue variance. */
export class StrictQueueVarianceView {
  code: string;
  nameText: string;
  visible: string;
  version: string;
  sendAt: string;
  rate: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    visible: string,
    version: string,
    sendAt: string,
    rate: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.visible = visible;
    this.version = version;
    this.sendAt = sendAt;
    this.rate = rate;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toStrictQueueVarianceView(item: StrictQueueVariance): StrictQueueVarianceView {
  return new StrictQueueVarianceView(
    item.code,
    item.name,
    `${item.visible}`,
    String(item.version),
    String(item.sendAt),
    item.rate.toFixed(2),
    text.truncate(item.title, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictQueueVarianceViews(items: StrictQueueVariance[]): StrictQueueVarianceView[] {
  const views: StrictQueueVarianceView[] = [];
  for (const item of items) {
    views.push(toStrictQueueVarianceView(item));
  }
  return views;
}

export function sumStrictQueueVarianceView(view: StrictQueueVarianceView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedVersion + parsedSendAt + parsedRate;
}
