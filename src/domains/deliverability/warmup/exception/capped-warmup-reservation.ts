import * as text from "../../../../kit/text.js";

/** Where a capped warmup reservation is in its life cycle. */
export type CappedWarmupReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A capped warmup reservation as the warmup team keeps it. */
export class CappedWarmupReservation {
  code: string;
  name: string;
  graceDays: number;
  variant: string;
  cost: number;
  audienceId: string;
  margin: number;
  status: CappedWarmupReservationStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    variant: string,
    cost: number,
    audienceId: string,
    margin: number,
    status: CappedWarmupReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.variant = variant;
    this.cost = cost;
    this.audienceId = audienceId;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedWarmupReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedWarmupReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped warmup reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round(this.cost * this.graceDays * 100) / 100;
  }

  copy(): CappedWarmupReservation {
    return new CappedWarmupReservation(
      this.code,
      this.name,
      this.graceDays,
      this.variant,
      this.cost,
      this.audienceId,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped warmup reservation in status planned. */
export function newCappedWarmupReservation(code: string, name: string): CappedWarmupReservation {
  return new CappedWarmupReservation(code, name, 0, "", 0, "", 0, "planned");
}
