import * as text from "../../../../kit/text.js";

/** Where a flight claim is in its life cycle. */
export type FlightClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A flight claim. Its code is unique within a tenant. */
export class FlightClaim {
  code: string;
  title: string;
  source: string;
  startsAt: number;
  label: string;
  retries: number;
  weight: number;
  score: number;
  unit: string;
  summary: string;
  status: FlightClaimStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    startsAt: number,
    label: string,
    retries: number,
    weight: number,
    score: number,
    unit: string,
    summary: string,
    status: FlightClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.startsAt = startsAt;
    this.label = label;
    this.retries = retries;
    this.weight = weight;
    this.score = score;
    this.unit = unit;
    this.summary = summary;
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

  canMoveTo(next: FlightClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
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
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round(this.weight * this.startsAt * 100) / 100;
  }

  copy(): FlightClaim {
    return new FlightClaim(
      this.code,
      this.title,
      this.source,
      this.startsAt,
      this.label,
      this.retries,
      this.weight,
      this.score,
      this.unit,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a flight claim in status planned. */
export function newFlightClaim(code: string, title: string): FlightClaim {
  return new FlightClaim(code, title, "", 0, "", 0, 0, 0, "", "", "planned");
}
