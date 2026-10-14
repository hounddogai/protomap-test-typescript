import { WarmupPreference } from "./warmup-preference.js";

/** How screens and exports show a warmup preference. */
export class WarmupPreferenceView {
  codeText: string;
  label: string;
  description: string;
  endsAt: string;
  visible: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    description: string,
    endsAt: string,
    visible: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.description = description;
    this.endsAt = endsAt;
    this.visible = visible;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupPreferenceView(item: WarmupPreference): WarmupPreferenceView {
  return new WarmupPreferenceView(
    item.code,
    item.label,
    item.description,
    String(item.endsAt),
    `${item.visible}`,
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupPreferenceViews(items: WarmupPreference[]): WarmupPreferenceView[] {
  const views: WarmupPreferenceView[] = [];
  for (const item of items) {
    views.push(toWarmupPreferenceView(item));
  }
  return views;
}

export function sumWarmupPreferenceView(view: WarmupPreferenceView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedEndsAt + parsedMinimum;
}
