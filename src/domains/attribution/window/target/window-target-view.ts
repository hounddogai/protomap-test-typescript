import { WindowTarget } from "./window-target.js";

/** How screens and exports show a window target. */
export class WindowTargetView {
  code: string;
  name: string;
  campaignRef: string;
  frequencyCap: string;
  weight: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    frequencyCap: string,
    weight: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.weight = weight;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowTargetView(item: WindowTarget): WindowTargetView {
  return new WindowTargetView(
    item.code,
    item.name,
    item.campaignRef,
    String(item.frequencyCap),
    item.weight.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowTargetViews(items: WindowTarget[]): WindowTargetView[] {
  const views: WindowTargetView[] = [];
  for (const item of items) {
    views.push(toWindowTargetView(item));
  }
  return views;
}

export function sumWindowTargetView(view: WindowTargetView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedFrequencyCap + parsedWeight + parsedEndsAt;
}
