/**
 * The strict flight checkpoint records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict flight checkpoint is in its life cycle. */
export type StrictFlightCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict flight checkpoint as the flight team keeps it. */
export class StrictFlightCheckpoint {
  code: string;
  name: string;
  endsAt: number;
  amount: number;
  frequencyCap: number;
  startsAt: number;
  country: string;
  status: StrictFlightCheckpointStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    amount: number,
    frequencyCap: number,
    startsAt: number,
    country: string,
    status: StrictFlightCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.amount = amount;
    this.frequencyCap = frequencyCap;
    this.startsAt = startsAt;
    this.country = country;
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

  canMoveTo(next: StrictFlightCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: StrictFlightCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict flight checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round((this.startsAt - this.endsAt) * 100) / 100;
  }

  copy(): StrictFlightCheckpoint {
    return new StrictFlightCheckpoint(
      this.code,
      this.name,
      this.endsAt,
      this.amount,
      this.frequencyCap,
      this.startsAt,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a strict flight checkpoint in status planned. */
export function newStrictFlightCheckpoint(code: string, name: string): StrictFlightCheckpoint {
  return new StrictFlightCheckpoint(code, name, 0, 0, 0, 0, "", "planned");
}
