import { RollingFlightBundle } from "./rolling-flight-bundle.js";

/** How screens and exports show a rolling flight bundle. */
export class RollingFlightBundleView {
  code: string;
  name: string;
  sendAt: string;
  locale: string;
  visible: string;
  checksum: string;
  source: string;
  ceilingText: string;
  retries: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sendAt: string,
    locale: string,
    visible: string,
    checksum: string,
    source: string,
    ceilingText: string,
    retries: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.locale = locale;
    this.visible = visible;
    this.checksum = checksum;
    this.source = source;
    this.ceilingText = ceilingText;
    this.retries = retries;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toRollingFlightBundleView(item: RollingFlightBundle): RollingFlightBundleView {
  return new RollingFlightBundleView(
    item.code,
    item.name,
    String(item.sendAt),
    item.locale,
    `${item.visible}`,
    item.checksum,
    item.source,
    item.ceiling.toFixed(2),
    String(item.retries),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingFlightBundleViews(items: RollingFlightBundle[]): RollingFlightBundleView[] {
  const views: RollingFlightBundleView[] = [];
  for (const item of items) {
    views.push(toRollingFlightBundleView(item));
  }
  return views;
}

export function sumRollingFlightBundleView(view: RollingFlightBundleView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedSendAt + parsedCeiling + parsedRetries;
}
