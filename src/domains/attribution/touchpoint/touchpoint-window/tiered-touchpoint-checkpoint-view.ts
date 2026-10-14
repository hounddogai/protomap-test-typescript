import * as text from "../../../../kit/text.js";
import { TieredTouchpointCheckpoint } from "./tiered-touchpoint-checkpoint.js";

/** How screens and exports show a tiered touchpoint checkpoint. */
export class TieredTouchpointCheckpointView {
  code: string;
  name: string;
  audienceId: string;
  locale: string;
  version: string;
  active: string;
  title: string;
  phone: string;
  description: string;
  ceilingText: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    locale: string,
    version: string,
    active: string,
    title: string,
    phone: string,
    description: string,
    ceilingText: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.locale = locale;
    this.version = version;
    this.active = active;
    this.title = title;
    this.phone = phone;
    this.description = description;
    this.ceilingText = ceilingText;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredTouchpointCheckpointView(item: TieredTouchpointCheckpoint): TieredTouchpointCheckpointView {
  return new TieredTouchpointCheckpointView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 40),
    text.truncate(item.audienceId, 40),
    text.truncate(item.locale, 40),
    String(item.version),
    `${item.active}`,
    text.truncate(item.title, 120),
    item.phone,
    item.description,
    item.ceiling.toFixed(2),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredTouchpointCheckpointViews(items: TieredTouchpointCheckpoint[]): TieredTouchpointCheckpointView[] {
  const views: TieredTouchpointCheckpointView[] = [];
  for (const item of items) {
    views.push(toTieredTouchpointCheckpointView(item));
  }
  return views;
}

export function sumTieredTouchpointCheckpointView(view: TieredTouchpointCheckpointView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedVersion + parsedCeiling;
}
