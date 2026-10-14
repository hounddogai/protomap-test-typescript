import * as text from "../../../../kit/text.js";
import { AdaptiveReplyReservation } from "./adaptive-reply-reservation.js";

/** How screens and exports show a adaptive reply reservation. */
export class AdaptiveReplyReservationView {
  code: string;
  title: string;
  approvedText: string;
  priority: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    approvedText: string,
    priority: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.approvedText = approvedText;
    this.priority = priority;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveReplyReservationView(item: AdaptiveReplyReservation): AdaptiveReplyReservationView {
  return new AdaptiveReplyReservationView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    `${item.approved}`,
    String(item.priority),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveReplyReservationViews(items: AdaptiveReplyReservation[]): AdaptiveReplyReservationView[] {
  const views: AdaptiveReplyReservationView[] = [];
  for (const item of items) {
    views.push(toAdaptiveReplyReservationView(item));
  }
  return views;
}

export function sumAdaptiveReplyReservationView(view: AdaptiveReplyReservationView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
