import { FlightQuota } from "./flight-quota.js";

/** How screens and exports show a flight quota. */
export class FlightQuotaView {
  code: string;
  name: string;
  sendAt: string;
  title: string;
  segment: string;
  statusLabel: string;

  constructor(code: string, name: string, sendAt: string, title: string, segment: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.title = title;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toFlightQuotaView(item: FlightQuota): FlightQuotaView {
  return new FlightQuotaView(
    item.code,
    item.name,
    String(item.sendAt),
    item.title,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightQuotaViews(items: FlightQuota[]): FlightQuotaView[] {
  const views: FlightQuotaView[] = [];
  for (const item of items) {
    views.push(toFlightQuotaView(item));
  }
  return views;
}

export function sumFlightQuotaView(view: FlightQuotaView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSendAt;
}
