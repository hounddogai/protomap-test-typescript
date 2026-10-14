/**
 * The flight digest records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a flight digest is in its life cycle. */
export type FlightDigestStatus = "created" | "validated" | "published" | "retired";

/** A flight digest as the flight team keeps it. */
export class FlightDigest {
  code: string;
  name: string;
  reviewer: string;
  audienceId: string;
  ratio: number;
  maximum: number;
  threshold: number;
  approved: boolean;
  locale: string;
  status: FlightDigestStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    audienceId: string,
    ratio: number,
    maximum: number,
    threshold: number,
    approved: boolean,
    locale: string,
    status: FlightDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.maximum = maximum;
    this.threshold = threshold;
    this.approved = approved;
    this.locale = locale;
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

  canMoveTo(next: FlightDigestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"flight digest"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.ratio * this.threshold * 100) / 100;
  }

  copy(): FlightDigest {
    return new FlightDigest(
      this.code,
      this.name,
      this.reviewer,
      this.audienceId,
      this.ratio,
      this.maximum,
      this.threshold,
      this.approved,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a flight digest in status created. */
export function newFlightDigest(code: string, name: string): FlightDigest {
  return new FlightDigest(code, name, "", "", 0, 0, 0, false, "", "created");
}
