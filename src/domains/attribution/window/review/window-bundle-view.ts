import { WindowBundle } from "./window-bundle.js";

/** How screens and exports show a window bundle. */
export class WindowBundleView {
  code: string;
  nameText: string;
  openRate: string;
  ownerIdText: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    openRate: string,
    ownerIdText: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.openRate = openRate;
    this.ownerIdText = ownerIdText;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowBundleView(item: WindowBundle): WindowBundleView {
  return new WindowBundleView(
    item.code,
    item.name,
    item.openRate.toFixed(2),
    item.ownerId,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowBundleViews(items: WindowBundle[]): WindowBundleView[] {
  const views: WindowBundleView[] = [];
  for (const item of items) {
    views.push(toWindowBundleView(item));
  }
  return views;
}

export function sumWindowBundleView(view: WindowBundleView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedOpenRate;
}
