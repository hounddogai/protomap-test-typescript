import { GlobalFlightEstimate } from "./global-flight-estimate.js";

/** How screens and exports show a global flight estimate. */
export class GlobalFlightEstimateView {
  code: string;
  title: string;
  country: string;
  channelText: string;
  audienceIdText: string;
  archived: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    country: string,
    channelText: string,
    audienceIdText: string,
    archived: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.channelText = channelText;
    this.audienceIdText = audienceIdText;
    this.archived = archived;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFlightEstimateView(item: GlobalFlightEstimate): GlobalFlightEstimateView {
  return new GlobalFlightEstimateView(
    item.code,
    item.title,
    item.country,
    item.channel,
    item.audienceId,
    `${item.archived}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFlightEstimateViews(items: GlobalFlightEstimate[]): GlobalFlightEstimateView[] {
  const views: GlobalFlightEstimateView[] = [];
  for (const item of items) {
    views.push(toGlobalFlightEstimateView(item));
  }
  return views;
}

export function sumGlobalFlightEstimateView(view: GlobalFlightEstimateView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
