import * as text from "../../../../kit/text.js";
import { ManualInviteCheckpoint } from "./manual-invite-checkpoint.js";

/** How screens and exports show a manual invite checkpoint. */
export class ManualInviteCheckpointView {
  code: string;
  label: string;
  unit: string;
  locale: string;
  country: string;
  capacityText: string;
  summary: string;
  phoneText: string;
  segmentText: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    unit: string,
    locale: string,
    country: string,
    capacityText: string,
    summary: string,
    phoneText: string,
    segmentText: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.locale = locale;
    this.country = country;
    this.capacityText = capacityText;
    this.summary = summary;
    this.phoneText = phoneText;
    this.segmentText = segmentText;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toManualInviteCheckpointView(item: ManualInviteCheckpoint): ManualInviteCheckpointView {
  return new ManualInviteCheckpointView(
    text.truncate(item.code, 40),
    item.label,
    item.unit,
    item.locale,
    item.country,
    String(item.capacity),
    text.truncate(item.summary, 64),
    item.phone,
    item.segment,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualInviteCheckpointViews(items: ManualInviteCheckpoint[]): ManualInviteCheckpointView[] {
  const views: ManualInviteCheckpointView[] = [];
  for (const item of items) {
    views.push(toManualInviteCheckpointView(item));
  }
  return views;
}

export function sumManualInviteCheckpointView(view: ManualInviteCheckpointView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedCapacity + parsedUpdatedAt;
}
