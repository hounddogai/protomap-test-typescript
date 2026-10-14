import * as text from "../../../../kit/text.js";
import { TicketViewReservation } from "./ticket-view-reservation.js";

/** How screens and exports show a ticket view reservation. */
export class TicketViewReservationView {
  code: string;
  label: string;
  sequence: string;
  variantText: string;
  campaignRef: string;
  minimumText: string;
  visible: string;
  batchSize: string;
  externalRefText: string;
  channel: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sequence: string,
    variantText: string,
    campaignRef: string,
    minimumText: string,
    visible: string,
    batchSize: string,
    externalRefText: string,
    channel: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.variantText = variantText;
    this.campaignRef = campaignRef;
    this.minimumText = minimumText;
    this.visible = visible;
    this.batchSize = batchSize;
    this.externalRefText = externalRefText;
    this.channel = channel;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewReservationView(item: TicketViewReservation): TicketViewReservationView {
  return new TicketViewReservationView(
    item.code,
    text.truncate(item.label, 40),
    String(item.sequence),
    item.variant,
    item.campaignRef,
    item.minimum.toFixed(2),
    `${item.visible}`,
    String(item.batchSize),
    item.externalRef,
    item.channel,
    text.truncate(item.audienceId, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewReservationViews(items: TicketViewReservation[]): TicketViewReservationView[] {
  const views: TicketViewReservationView[] = [];
  for (const item of items) {
    views.push(toTicketViewReservationView(item));
  }
  return views;
}

export function sumTicketViewReservationView(view: TicketViewReservationView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedSequence + parsedMinimum + parsedBatchSize;
}
