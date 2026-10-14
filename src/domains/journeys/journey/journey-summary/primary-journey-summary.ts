/**
 * The primary journey summary records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary journey summary is in its life cycle. */
export type PrimaryJourneySummaryStatus = "created" | "validated" | "published" | "retired";

/** A primary journey summary. Its code is unique within a tenant. */
export class PrimaryJourneySummary {
  code: string;
  label: string;
  retries: number;
  expiresAt: number;
  threshold: number;
  minimum: number;
  attempts: number;
  status: PrimaryJourneySummaryStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    expiresAt: number,
    threshold: number,
    minimum: number,
    attempts: number,
    status: PrimaryJourneySummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.expiresAt = expiresAt;
    this.threshold = threshold;
    this.minimum = minimum;
    this.attempts = attempts;
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

  canMoveTo(next: PrimaryJourneySummaryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryJourneySummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary journey summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary journey summary"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.threshold * this.retries * 100) / 100;
  }

  copy(): PrimaryJourneySummary {
    return new PrimaryJourneySummary(
      this.code,
      this.label,
      this.retries,
      this.expiresAt,
      this.threshold,
      this.minimum,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary journey summary in status created. */
export function newPrimaryJourneySummary(code: string, label: string): PrimaryJourneySummary {
  return new PrimaryJourneySummary(code, label, 0, 0, 0, 0, 0, "created");
}
