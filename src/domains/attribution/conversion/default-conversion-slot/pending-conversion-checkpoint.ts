import * as text from "../../../../kit/text.js";

/** Where a pending conversion checkpoint is in its life cycle. */
export type PendingConversionCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending conversion checkpoint and its current status. */
export class PendingConversionCheckpoint {
  code: string;
  label: string;
  name: string;
  bid: number;
  startsAt: number;
  country: string;
  contactEmail: string;
  attempts: number;
  status: PendingConversionCheckpointStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    bid: number,
    startsAt: number,
    country: string,
    contactEmail: string,
    attempts: number,
    status: PendingConversionCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.bid = bid;
    this.startsAt = startsAt;
    this.country = country;
    this.contactEmail = contactEmail;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingConversionCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingConversionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending conversion checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"pending conversion checkpoint"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.startsAt + this.attempts) * 100) / 100;
  }

  copy(): PendingConversionCheckpoint {
    return new PendingConversionCheckpoint(
      this.code,
      this.label,
      this.name,
      this.bid,
      this.startsAt,
      this.country,
      this.contactEmail,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending conversion checkpoint in status open. */
export function newPendingConversionCheckpoint(code: string, label: string): PendingConversionCheckpoint {
  return new PendingConversionCheckpoint(code, label, "", 0, 0, "", "", 0, "open");
}
