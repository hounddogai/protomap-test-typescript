import * as text from "../../../../kit/text.js";
import { ProofDigest } from "./proof-digest.js";

/** How screens and exports show a proof digest. */
export class ProofDigestView {
  code: string;
  name: string;
  durationMinutes: string;
  region: string;
  revision: string;
  externalRef: string;
  variant: string;
  capacityText: string;
  phone: string;
  channel: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    durationMinutes: string,
    region: string,
    revision: string,
    externalRef: string,
    variant: string,
    capacityText: string,
    phone: string,
    channel: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.region = region;
    this.revision = revision;
    this.externalRef = externalRef;
    this.variant = variant;
    this.capacityText = capacityText;
    this.phone = phone;
    this.channel = channel;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toProofDigestView(item: ProofDigest): ProofDigestView {
  return new ProofDigestView(
    item.code,
    item.name,
    String(item.durationMinutes),
    item.region,
    String(item.revision),
    item.externalRef,
    text.truncate(item.variant, 120),
    String(item.capacity),
    item.phone,
    item.channel,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toProofDigestViews(items: ProofDigest[]): ProofDigestView[] {
  const views: ProofDigestView[] = [];
  for (const item of items) {
    views.push(toProofDigestView(item));
  }
  return views;
}

export function sumProofDigestView(view: ProofDigestView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedDurationMinutes + parsedRevision + parsedCapacity;
}
