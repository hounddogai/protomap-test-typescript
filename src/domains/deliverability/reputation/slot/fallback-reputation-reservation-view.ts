import * as text from "../../../../kit/text.js";
import { FallbackReputationReservation } from "./fallback-reputation-reservation.js";

/** How screens and exports show a fallback reputation reservation. */
export class FallbackReputationReservationView {
  codeText: string;
  title: string;
  frequencyCap: string;
  sequenceText: string;
  externalRef: string;
  ownerId: string;
  cost: string;
  category: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    frequencyCap: string,
    sequenceText: string,
    externalRef: string,
    ownerId: string,
    cost: string,
    category: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.sequenceText = sequenceText;
    this.externalRef = externalRef;
    this.ownerId = ownerId;
    this.cost = cost;
    this.category = category;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackReputationReservationView(item: FallbackReputationReservation): FallbackReputationReservationView {
  return new FallbackReputationReservationView(
    item.code,
    item.title,
    String(item.frequencyCap),
    String(item.sequence),
    item.externalRef,
    item.ownerId,
    item.cost.toFixed(2),
    text.truncate(item.category, 64),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackReputationReservationViews(items: FallbackReputationReservation[]): FallbackReputationReservationView[] {
  const views: FallbackReputationReservationView[] = [];
  for (const item of items) {
    views.push(toFallbackReputationReservationView(item));
  }
  return views;
}

export function sumFallbackReputationReservationView(view: FallbackReputationReservationView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedFrequencyCap + parsedSequence + parsedCost;
}
