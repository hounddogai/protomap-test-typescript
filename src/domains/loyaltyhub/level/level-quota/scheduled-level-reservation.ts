import * as text from "../../../../kit/text.js";

/** Where a scheduled level reservation is in its life cycle. */
export type ScheduledLevelReservationStatus = "created" | "validated" | "published" | "retired";

/** A scheduled level reservation. Its code is unique within a tenant. */
export class ScheduledLevelReservation {
  code: string;
  name: string;
  segment: string;
  source: string;
  archived: boolean;
  discount: number;
  currency: string;
  windowDays: number;
  status: ScheduledLevelReservationStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    source: string,
    archived: boolean,
    discount: number,
    currency: string,
    windowDays: number,
    status: ScheduledLevelReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.source = source;
    this.archived = archived;
    this.discount = discount;
    this.currency = currency;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledLevelReservationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledLevelReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled level reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round(this.windowDays * this.discount * 100) / 100;
  }

  copy(): ScheduledLevelReservation {
    return new ScheduledLevelReservation(
      this.code,
      this.name,
      this.segment,
      this.source,
      this.archived,
      this.discount,
      this.currency,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled level reservation in status created. */
export function newScheduledLevelReservation(code: string, name: string): ScheduledLevelReservation {
  return new ScheduledLevelReservation(code, name, "", "", false, 0, "", 0, "created");
}
