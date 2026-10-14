import * as text from "../../../../kit/text.js";
import { AdaptiveSlaAdjustment } from "./adaptive-sla-adjustment.js";

/** How screens and exports show a adaptive sla adjustment. */
export class AdaptiveSlaAdjustmentView {
  code: string;
  label: string;
  contactEmail: string;
  audienceIdText: string;
  cohort: string;
  checksum: string;
  attempts: string;
  version: string;
  visible: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    audienceIdText: string,
    cohort: string,
    checksum: string,
    attempts: string,
    version: string,
    visible: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.audienceIdText = audienceIdText;
    this.cohort = cohort;
    this.checksum = checksum;
    this.attempts = attempts;
    this.version = version;
    this.visible = visible;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveSlaAdjustmentView(item: AdaptiveSlaAdjustment): AdaptiveSlaAdjustmentView {
  return new AdaptiveSlaAdjustmentView(
    text.truncate(item.code, 64),
    item.label,
    item.contactEmail,
    text.truncate(item.audienceId, 40),
    item.cohort,
    item.checksum,
    String(item.attempts),
    String(item.version),
    `${item.visible}`,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveSlaAdjustmentViews(items: AdaptiveSlaAdjustment[]): AdaptiveSlaAdjustmentView[] {
  const views: AdaptiveSlaAdjustmentView[] = [];
  for (const item of items) {
    views.push(toAdaptiveSlaAdjustmentView(item));
  }
  return views;
}

export function sumAdaptiveSlaAdjustmentView(view: AdaptiveSlaAdjustmentView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedAttempts + parsedVersion;
}
