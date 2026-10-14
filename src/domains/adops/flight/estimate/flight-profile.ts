import * as text from "../../../../kit/text.js";

/** Where a flight profile is in its life cycle. */
export type FlightProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a flight profile and its current status. */
export class FlightProfile {
  code: string;
  title: string;
  graceDays: number;
  region: string;
  name: string;
  priority: number;
  status: FlightProfileStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    region: string,
    name: string,
    priority: number,
    status: FlightProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.region = region;
    this.name = name;
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

  canMoveTo(next: FlightProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FlightProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.priority + this.graceDays) * 100) / 100;
  }

  copy(): FlightProfile {
    return new FlightProfile(this.code, this.title, this.graceDays, this.region, this.name, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a flight profile in status proposed. */
export function newFlightProfile(code: string, title: string): FlightProfile {
  return new FlightProfile(code, title, 0, "", "", 0, "proposed");
}
