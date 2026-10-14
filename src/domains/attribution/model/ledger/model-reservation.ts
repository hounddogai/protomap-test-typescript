import * as text from "../../../../kit/text.js";

/** Where a model reservation is in its life cycle. */
export type ModelReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** A model reservation as the model team keeps it. */
export class ModelReservation {
  code: string;
  name: string;
  source: string;
  segment: string;
  startsAt: number;
  status: ModelReservationStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    segment: string,
    startsAt: number,
    status: ModelReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.segment = segment;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): ModelReservation {
    return new ModelReservation(this.code, this.name, this.source, this.segment, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a model reservation in status requested. */
export function newModelReservation(code: string, name: string): ModelReservation {
  return new ModelReservation(code, name, "", "", 0, "requested");
}
