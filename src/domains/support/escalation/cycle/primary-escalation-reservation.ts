import * as text from "../../../../kit/text.js";

/** Where a primary escalation reservation is in its life cycle. */
export type PrimaryEscalationReservationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary escalation reservation. Its code is unique within a tenant. */
export class PrimaryEscalationReservation {
  code: string;
  label: string;
  reviewer: string;
  budget: number;
  checksum: string;
  attempts: number;
  clicks: number;
  visible: boolean;
  locale: string;
  externalRef: string;
  status: PrimaryEscalationReservationStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    budget: number,
    checksum: string,
    attempts: number,
    clicks: number,
    visible: boolean,
    locale: string,
    externalRef: string,
    status: PrimaryEscalationReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.budget = budget;
    this.checksum = checksum;
    this.attempts = attempts;
    this.clicks = clicks;
    this.visible = visible;
    this.locale = locale;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryEscalationReservationStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimaryEscalationReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary escalation reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.clicks - this.attempts) * 100) / 100;
  }

  copy(): PrimaryEscalationReservation {
    return new PrimaryEscalationReservation(
      this.code,
      this.label,
      this.reviewer,
      this.budget,
      this.checksum,
      this.attempts,
      this.clicks,
      this.visible,
      this.locale,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary escalation reservation in status draft. */
export function newPrimaryEscalationReservation(code: string, label: string): PrimaryEscalationReservation {
  return new PrimaryEscalationReservation(code, label, "", 0, "", 0, 0, false, "", "", "draft");
}
