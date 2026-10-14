import * as text from "../../../../kit/text.js";

/** Where a ticket view reservation is in its life cycle. */
export type TicketViewReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A ticket view reservation as the ticket view team keeps it. */
export class TicketViewReservation {
  code: string;
  label: string;
  sequence: number;
  variant: string;
  campaignRef: string;
  minimum: number;
  visible: boolean;
  batchSize: number;
  externalRef: string;
  channel: string;
  audienceId: string;
  status: TicketViewReservationStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    variant: string,
    campaignRef: string,
    minimum: number,
    visible: boolean,
    batchSize: number,
    externalRef: string,
    channel: string,
    audienceId: string,
    status: TicketViewReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.variant = variant;
    this.campaignRef = campaignRef;
    this.minimum = minimum;
    this.visible = visible;
    this.batchSize = batchSize;
    this.externalRef = externalRef;
    this.channel = channel;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round(this.batchSize * this.sequence * 100) / 100;
  }

  copy(): TicketViewReservation {
    return new TicketViewReservation(
      this.code,
      this.label,
      this.sequence,
      this.variant,
      this.campaignRef,
      this.minimum,
      this.visible,
      this.batchSize,
      this.externalRef,
      this.channel,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a ticket view reservation in status proposed. */
export function newTicketViewReservation(code: string, label: string): TicketViewReservation {
  return new TicketViewReservation(code, label, 0, "", "", 0, false, 0, "", "", "", "proposed");
}
