import { CsatWindow } from "./csat-window.js";

/** How screens and exports show a csat window. */
export class CsatWindowView {
  code: string;
  name: string;
  version: string;
  sendAt: string;
  conversionRate: string;
  locale: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    version: string,
    sendAt: string,
    conversionRate: string,
    locale: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.sendAt = sendAt;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toCsatWindowView(item: CsatWindow): CsatWindowView {
  return new CsatWindowView(
    item.code,
    item.name,
    String(item.version),
    String(item.sendAt),
    item.conversionRate.toFixed(2),
    item.locale,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatWindowViews(items: CsatWindow[]): CsatWindowView[] {
  const views: CsatWindowView[] = [];
  for (const item of items) {
    views.push(toCsatWindowView(item));
  }
  return views;
}

export function sumCsatWindowView(view: CsatWindowView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedVersion + parsedSendAt + parsedConversionRate;
}
