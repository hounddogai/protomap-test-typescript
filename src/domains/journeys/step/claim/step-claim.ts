/**
 * The step claim records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step claim is in its life cycle. */
export type StepClaimStatus = "created" | "validated" | "published" | "retired";

/** The record of a step claim and its current status. */
export class StepClaim {
  code: string;
  label: string;
  utmSource: string;
  capacity: number;
  country: string;
  attempts: number;
  quantity: number;
  retries: number;
  region: string;
  source: string;
  summary: string;
  status: StepClaimStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    capacity: number,
    country: string,
    attempts: number,
    quantity: number,
    retries: number,
    region: string,
    source: string,
    summary: string,
    status: StepClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.capacity = capacity;
    this.country = country;
    this.attempts = attempts;
    this.quantity = quantity;
    this.retries = retries;
    this.region = region;
    this.source = source;
    this.summary = summary;
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

  canMoveTo(next: StepClaimStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"step claim"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.quantity - this.attempts) * 100) / 100;
  }

  copy(): StepClaim {
    return new StepClaim(
      this.code,
      this.label,
      this.utmSource,
      this.capacity,
      this.country,
      this.attempts,
      this.quantity,
      this.retries,
      this.region,
      this.source,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a step claim in status created. */
export function newStepClaim(code: string, label: string): StepClaim {
  return new StepClaim(code, label, "", 0, "", 0, 0, 0, "", "", "", "created");
}
