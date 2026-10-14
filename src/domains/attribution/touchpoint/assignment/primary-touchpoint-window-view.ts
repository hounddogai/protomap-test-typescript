import * as text from "../../../../kit/text.js";
import { PrimaryTouchpointWindow } from "./primary-touchpoint-window.js";

/** How screens and exports show a primary touchpoint window. */
export class PrimaryTouchpointWindowView {
  code: string;
  label: string;
  versionText: string;
  pinned: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    versionText: string,
    pinned: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.versionText = versionText;
    this.pinned = pinned;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryTouchpointWindowView(item: PrimaryTouchpointWindow): PrimaryTouchpointWindowView {
  return new PrimaryTouchpointWindowView(
    item.code,
    text.truncate(item.label, 120),
    String(item.version),
    `${item.pinned}`,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryTouchpointWindowViews(items: PrimaryTouchpointWindow[]): PrimaryTouchpointWindowView[] {
  const views: PrimaryTouchpointWindowView[] = [];
  for (const item of items) {
    views.push(toPrimaryTouchpointWindowView(item));
  }
  return views;
}

export function sumPrimaryTouchpointWindowView(view: PrimaryTouchpointWindowView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedVersion + parsedUpdatedAt;
}
