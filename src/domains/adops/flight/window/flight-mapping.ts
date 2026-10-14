import * as text from "../../../../kit/text.js";

/** Where a flight mapping is in its life cycle. */
export type FlightMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A flight mapping as the flight team keeps it. */
export class FlightMapping {
  code: string;
  name: string;
  externalRef: string;
  version: number;
  sequence: number;
  status: FlightMappingStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    version: number,
    sequence: number,
    status: FlightMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.version = version;
    this.sequence = sequence;
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

  canMoveTo(next: FlightMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FlightMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedValue(): number {
    return Math.round((this.sequence - this.version) * 100) / 100;
  }

  copy(): FlightMapping {
    return new FlightMapping(this.code, this.name, this.externalRef, this.version, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a flight mapping in status proposed. */
export function newFlightMapping(code: string, name: string): FlightMapping {
  return new FlightMapping(code, name, "", 0, 0, "proposed");
}
