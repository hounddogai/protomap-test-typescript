/**
 * The double opt in batch records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in batch is in its life cycle. */
export type DoubleOptInBatchStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A double opt in batch as the double opt in team keeps it. */
export class DoubleOptInBatch {
  code: string;
  title: string;
  endsAt: number;
  margin: number;
  name: string;
  timezone: string;
  ceiling: number;
  status: DoubleOptInBatchStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    margin: number,
    name: string,
    timezone: string,
    ceiling: number,
    status: DoubleOptInBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.margin = margin;
    this.name = name;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DoubleOptInBatchStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round(this.ceiling * this.endsAt * 100) / 100;
  }

  copy(): DoubleOptInBatch {
    return new DoubleOptInBatch(
      this.code,
      this.title,
      this.endsAt,
      this.margin,
      this.name,
      this.timezone,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a double opt in batch in status open. */
export function newDoubleOptInBatch(code: string, title: string): DoubleOptInBatch {
  return new DoubleOptInBatch(code, title, 0, 0, "", "", 0, "open");
}
