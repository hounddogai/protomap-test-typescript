import * as text from "../../../../kit/text.js";

/** Where a tiered escalation reservation is in its life cycle. */
export type TieredEscalationReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered escalation reservation as the escalation team keeps it. */
export class TieredEscalationReservation {
  code: string;
  label: string;
  ownerId: string;
  updatedAt: number;
  threshold: number;
  utmSource: string;
  cohort: string;
  channel: string;
  score: number;
  priority: number;
  status: TieredEscalationReservationStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    updatedAt: number,
    threshold: number,
    utmSource: string,
    cohort: string,
    channel: string,
    score: number,
    priority: number,
    status: TieredEscalationReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.updatedAt = updatedAt;
    this.threshold = threshold;
    this.utmSource = utmSource;
    this.cohort = cohort;
    this.channel = channel;
    this.score = score;
    this.priority = priority;
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

  canMoveTo(next: TieredEscalationReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TieredEscalationReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered escalation reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered escalation reservation"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.score - this.updatedAt) * 100) / 100;
  }

  copy(): TieredEscalationReservation {
    return new TieredEscalationReservation(
      this.code,
      this.label,
      this.ownerId,
      this.updatedAt,
      this.threshold,
      this.utmSource,
      this.cohort,
      this.channel,
      this.score,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered escalation reservation in status proposed. */
export function newTieredEscalationReservation(code: string, label: string): TieredEscalationReservation {
  return new TieredEscalationReservation(code, label, "", 0, 0, "", "", "", 0, 0, "proposed");
}
