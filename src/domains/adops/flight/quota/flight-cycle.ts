import * as text from "../../../../kit/text.js";

/** Where a flight cycle is in its life cycle. */
export type FlightCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A flight cycle. Its code is unique within a tenant. */
export class FlightCycle {
  code: string;
  title: string;
  minimum: number;
  sequence: number;
  audienceId: string;
  clicks: number;
  campaignRef: string;
  threshold: number;
  source: string;
  status: FlightCycleStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    sequence: number,
    audienceId: string,
    clicks: number,
    campaignRef: string,
    threshold: number,
    source: string,
    status: FlightCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.sequence = sequence;
    this.audienceId = audienceId;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.threshold = threshold;
    this.source = source;
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

  canMoveTo(next: FlightCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"flight cycle"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.sequence + this.threshold) * 100) / 100;
  }

  copy(): FlightCycle {
    return new FlightCycle(
      this.code,
      this.title,
      this.minimum,
      this.sequence,
      this.audienceId,
      this.clicks,
      this.campaignRef,
      this.threshold,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a flight cycle in status planned. */
export function newFlightCycle(code: string, title: string): FlightCycle {
  return new FlightCycle(code, title, 0, 0, "", 0, "", 0, "", "planned");
}
