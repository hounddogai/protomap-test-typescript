import * as text from "../../../../kit/text.js";
import { PostOverride } from "./post-override.js";

/** How screens and exports show a post override. */
export class PostOverrideView {
  codeText: string;
  title: string;
  ratio: string;
  durationMinutes: string;
  activeText: string;
  createdAt: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ratio: string,
    durationMinutes: string,
    activeText: string,
    createdAt: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.activeText = activeText;
    this.createdAt = createdAt;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toPostOverrideView(item: PostOverride): PostOverrideView {
  return new PostOverrideView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    item.ratio.toFixed(2),
    String(item.durationMinutes),
    `${item.active}`,
    String(item.createdAt),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostOverrideViews(items: PostOverride[]): PostOverrideView[] {
  const views: PostOverrideView[] = [];
  for (const item of items) {
    views.push(toPostOverrideView(item));
  }
  return views;
}

export function sumPostOverrideView(view: PostOverrideView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedRatio + parsedDurationMinutes + parsedCreatedAt;
}
