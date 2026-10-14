import * as text from "../../../../kit/text.js";

/** Where a primary activation reservation is in its life cycle. */
export type PrimaryActivationReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A primary activation reservation as the activation team keeps it. */
export class PrimaryActivationReservation {
  code: string;
  name: string;
  cohort: string;
  cost: number;
  source: string;
  status: PrimaryActivationReservationStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    cost: number,
    source: string,
    status: PrimaryActivationReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.cost = cost;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryActivationReservationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryActivationReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary activation reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): PrimaryActivationReservation {
    return new PrimaryActivationReservation(this.code, this.name, this.cohort, this.cost, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a primary activation reservation in status new. */
export function newPrimaryActivationReservation(code: string, name: string): PrimaryActivationReservation {
  return new PrimaryActivationReservation(code, name, "", 0, "", "new");
}
