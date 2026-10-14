import * as text from "../../../../kit/text.js";
import { RollingPathTemplate } from "./rolling-path-template.js";

/** How screens and exports show a rolling path template. */
export class RollingPathTemplateView {
  code: string;
  name: string;
  floorValue: string;
  categoryText: string;
  expiresAt: string;
  activeText: string;
  locale: string;
  revisionText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    floorValue: string,
    categoryText: string,
    expiresAt: string,
    activeText: string,
    locale: string,
    revisionText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.categoryText = categoryText;
    this.expiresAt = expiresAt;
    this.activeText = activeText;
    this.locale = locale;
    this.revisionText = revisionText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPathTemplateView(item: RollingPathTemplate): RollingPathTemplateView {
  return new RollingPathTemplateView(
    item.code,
    text.truncate(item.name, 40),
    item.floorValue.toFixed(2),
    item.category,
    String(item.expiresAt),
    `${item.active}`,
    item.locale,
    String(item.revision),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPathTemplateViews(items: RollingPathTemplate[]): RollingPathTemplateView[] {
  const views: RollingPathTemplateView[] = [];
  for (const item of items) {
    views.push(toRollingPathTemplateView(item));
  }
  return views;
}

export function sumRollingPathTemplateView(view: RollingPathTemplateView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedFloorValue + parsedExpiresAt + parsedRevision;
}
