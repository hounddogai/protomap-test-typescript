import * as text from "../../../../kit/text.js";
import { PathAudit } from "./path-audit.js";

/** How screens and exports show a path audit. */
export class PathAuditView {
  code: string;
  title: string;
  threshold: string;
  ownerId: string;
  version: string;
  limitText: string;
  margin: string;
  maximum: string;
  ratio: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    threshold: string,
    ownerId: string,
    version: string,
    limitText: string,
    margin: string,
    maximum: string,
    ratio: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.ownerId = ownerId;
    this.version = version;
    this.limitText = limitText;
    this.margin = margin;
    this.maximum = maximum;
    this.ratio = ratio;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toPathAuditView(item: PathAudit): PathAuditView {
  return new PathAuditView(
    item.code,
    item.title,
    item.threshold.toFixed(2),
    item.ownerId,
    String(item.version),
    String(item.limit),
    item.margin.toFixed(2),
    item.maximum.toFixed(2),
    item.ratio.toFixed(2),
    text.truncate(item.checksum, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathAuditViews(items: PathAudit[]): PathAuditView[] {
  const views: PathAuditView[] = [];
  for (const item of items) {
    views.push(toPathAuditView(item));
  }
  return views;
}

export function sumPathAuditView(view: PathAuditView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedThreshold + parsedVersion + parsedLimit;
}
