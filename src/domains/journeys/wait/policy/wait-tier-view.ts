import { WaitTier } from "./wait-tier.js";

/** How screens and exports show a wait tier. */
export class WaitTierView {
  code: string;
  label: string;
  version: string;
  endsAtText: string;
  externalRefText: string;
  audienceId: string;
  weight: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    version: string,
    endsAtText: string,
    externalRefText: string,
    audienceId: string,
    weight: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.endsAtText = endsAtText;
    this.externalRefText = externalRefText;
    this.audienceId = audienceId;
    this.weight = weight;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toWaitTierView(item: WaitTier): WaitTierView {
  return new WaitTierView(
    item.code,
    item.label,
    String(item.version),
    String(item.endsAt),
    item.externalRef,
    item.audienceId,
    item.weight.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitTierViews(items: WaitTier[]): WaitTierView[] {
  const views: WaitTierView[] = [];
  for (const item of items) {
    views.push(toWaitTierView(item));
  }
  return views;
}

export function sumWaitTierView(view: WaitTierView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedVersion + parsedEndsAt + parsedWeight;
}
