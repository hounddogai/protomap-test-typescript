import * as text from "../../../../kit/text.js";
import { LegacyTouchpointTemplate } from "./legacy-touchpoint-template.js";

/** How screens and exports show a legacy touchpoint template. */
export class LegacyTouchpointTemplateView {
  code: string;
  name: string;
  version: string;
  createdAt: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    version: string,
    createdAt: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.createdAt = createdAt;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyTouchpointTemplateView(item: LegacyTouchpointTemplate): LegacyTouchpointTemplateView {
  return new LegacyTouchpointTemplateView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 40),
    String(item.version),
    String(item.createdAt),
    text.truncate(item.category, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyTouchpointTemplateViews(items: LegacyTouchpointTemplate[]): LegacyTouchpointTemplateView[] {
  const views: LegacyTouchpointTemplateView[] = [];
  for (const item of items) {
    views.push(toLegacyTouchpointTemplateView(item));
  }
  return views;
}

export function sumLegacyTouchpointTemplateView(view: LegacyTouchpointTemplateView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedVersion + parsedCreatedAt;
}
