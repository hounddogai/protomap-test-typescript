import { PendingReplyReservation } from "./pending-reply-reservation.js";

/** How screens and exports show a pending reply reservation. */
export class PendingReplyReservationView {
  code: string;
  nameText: string;
  weight: string;
  checksum: string;
  audienceId: string;
  archived: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    weight: string,
    checksum: string,
    audienceId: string,
    archived: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.weight = weight;
    this.checksum = checksum;
    this.audienceId = audienceId;
    this.archived = archived;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toPendingReplyReservationView(item: PendingReplyReservation): PendingReplyReservationView {
  return new PendingReplyReservationView(
    item.code,
    item.name,
    item.weight.toFixed(2),
    item.checksum,
    item.audienceId,
    `${item.archived}`,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingReplyReservationViews(items: PendingReplyReservation[]): PendingReplyReservationView[] {
  const views: PendingReplyReservationView[] = [];
  for (const item of items) {
    views.push(toPendingReplyReservationView(item));
  }
  return views;
}

export function sumPendingReplyReservationView(view: PendingReplyReservationView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedWeight + parsedBatchSize;
}
