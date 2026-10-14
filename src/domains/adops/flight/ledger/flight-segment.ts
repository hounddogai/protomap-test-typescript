import * as text from "../../../../kit/text.js";

/** Where a flight segment is in its life cycle. */
export type FlightSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A flight segment as the flight team keeps it. */
export class FlightSegment {
  code: string;
  label: string;
  variant: string;
  ownerId: string;
  audienceId: string;
  score: number;
  status: FlightSegmentStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    ownerId: string,
    audienceId: string,
    score: number,
    status: FlightSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.ownerId = ownerId;
    this.audienceId = audienceId;
    this.score = score;
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

  canMoveTo(next: FlightSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FlightSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): FlightSegment {
    return new FlightSegment(
      this.code,
      this.label,
      this.variant,
      this.ownerId,
      this.audienceId,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a flight segment in status proposed. */
export function newFlightSegment(code: string, label: string): FlightSegment {
  return new FlightSegment(code, label, "", "", "", 0, "proposed");
}
