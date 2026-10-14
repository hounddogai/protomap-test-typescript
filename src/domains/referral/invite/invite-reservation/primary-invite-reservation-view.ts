import { PrimaryInviteReservation } from "./primary-invite-reservation.js";

/** How screens and exports show a primary invite reservation. */
export class PrimaryInviteReservationView {
  codeText: string;
  nameText: string;
  rate: string;
  floorValueText: string;
  score: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    rate: string,
    floorValueText: string,
    score: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.rate = rate;
    this.floorValueText = floorValueText;
    this.score = score;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryInviteReservationView(item: PrimaryInviteReservation): PrimaryInviteReservationView {
  return new PrimaryInviteReservationView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    item.floorValue.toFixed(2),
    item.score.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryInviteReservationViews(items: PrimaryInviteReservation[]): PrimaryInviteReservationView[] {
  const views: PrimaryInviteReservationView[] = [];
  for (const item of items) {
    views.push(toPrimaryInviteReservationView(item));
  }
  return views;
}

export function sumPrimaryInviteReservationView(view: PrimaryInviteReservationView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedRate + parsedFloorValue + parsedScore;
}
