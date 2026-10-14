import * as text from "../../../../kit/text.js";
import { PendingComplaintMapping } from "./pending-complaint-mapping.js";

/** How screens and exports show a pending complaint mapping. */
export class PendingComplaintMappingView {
  code: string;
  name: string;
  notesText: string;
  marginText: string;
  endsAtText: string;
  openRateText: string;
  audienceId: string;
  limit: string;
  quantity: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    notesText: string,
    marginText: string,
    endsAtText: string,
    openRateText: string,
    audienceId: string,
    limit: string,
    quantity: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.notesText = notesText;
    this.marginText = marginText;
    this.endsAtText = endsAtText;
    this.openRateText = openRateText;
    this.audienceId = audienceId;
    this.limit = limit;
    this.quantity = quantity;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toPendingComplaintMappingView(item: PendingComplaintMapping): PendingComplaintMappingView {
  return new PendingComplaintMappingView(
    item.code,
    text.truncate(item.name, 64),
    item.notes,
    item.margin.toFixed(2),
    String(item.endsAt),
    item.openRate.toFixed(2),
    item.audienceId,
    String(item.limit),
    String(item.quantity),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingComplaintMappingViews(items: PendingComplaintMapping[]): PendingComplaintMappingView[] {
  const views: PendingComplaintMappingView[] = [];
  for (const item of items) {
    views.push(toPendingComplaintMappingView(item));
  }
  return views;
}

export function sumPendingComplaintMappingView(view: PendingComplaintMappingView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedMargin + parsedEndsAt + parsedOpenRate;
}
