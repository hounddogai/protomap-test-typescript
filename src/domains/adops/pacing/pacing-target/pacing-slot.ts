import * as text from "../../../../kit/text.js";

/** Where a pacing slot is in its life cycle. */
export type PacingSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pacing slot as the pacing team keeps it. */
export class PacingSlot {
  code: string;
  label: string;
  floorValue: number;
  endsAt: number;
  conversionRate: number;
  expiresAt: number;
  status: PacingSlotStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    endsAt: number,
    conversionRate: number,
    expiresAt: number,
    status: PacingSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: PacingSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round(this.endsAt * this.expiresAt * 100) / 100;
  }

  copy(): PacingSlot {
    return new PacingSlot(
      this.code,
      this.label,
      this.floorValue,
      this.endsAt,
      this.conversionRate,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pacing slot in status open. */
export function newPacingSlot(code: string, label: string): PacingSlot {
  return new PacingSlot(code, label, 0, 0, 0, 0, "open");
}
