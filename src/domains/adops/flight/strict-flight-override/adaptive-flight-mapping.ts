import * as text from "../../../../kit/text.js";

/** Where a adaptive flight mapping is in its life cycle. */
export type AdaptiveFlightMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive flight mapping as the flight team keeps it. */
export class AdaptiveFlightMapping {
  code: string;
  name: string;
  openRate: number;
  capacity: number;
  windowDays: number;
  status: AdaptiveFlightMappingStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    capacity: number,
    windowDays: number,
    status: AdaptiveFlightMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.capacity = capacity;
    this.windowDays = windowDays;
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

  canMoveTo(next: AdaptiveFlightMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveFlightMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive flight mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive flight mapping"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.openRate - this.capacity) * 100) / 100;
  }

  copy(): AdaptiveFlightMapping {
    return new AdaptiveFlightMapping(this.code, this.name, this.openRate, this.capacity, this.windowDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive flight mapping in status planned. */
export function newAdaptiveFlightMapping(code: string, name: string): AdaptiveFlightMapping {
  return new AdaptiveFlightMapping(code, name, 0, 0, 0, "planned");
}
