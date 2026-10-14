import * as text from "../../../../kit/text.js";
import { DoubleOptInManifest } from "./double-opt-in-manifest.js";

/** How screens and exports show a double opt in manifest. */
export class DoubleOptInManifestView {
  code: string;
  nameText: string;
  priority: string;
  utmSourceText: string;
  regionText: string;
  revision: string;
  startsAt: string;
  sendAt: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    priority: string,
    utmSourceText: string,
    regionText: string,
    revision: string,
    startsAt: string,
    sendAt: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.priority = priority;
    this.utmSourceText = utmSourceText;
    this.regionText = regionText;
    this.revision = revision;
    this.startsAt = startsAt;
    this.sendAt = sendAt;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInManifestView(item: DoubleOptInManifest): DoubleOptInManifestView {
  return new DoubleOptInManifestView(
    text.truncate(item.code, 80),
    item.name,
    String(item.priority),
    item.utmSource,
    text.truncate(item.region, 120),
    String(item.revision),
    String(item.startsAt),
    String(item.sendAt),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInManifestViews(items: DoubleOptInManifest[]): DoubleOptInManifestView[] {
  const views: DoubleOptInManifestView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInManifestView(item));
  }
  return views;
}

export function sumDoubleOptInManifestView(view: DoubleOptInManifestView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedPriority + parsedRevision + parsedStartsAt;
}
