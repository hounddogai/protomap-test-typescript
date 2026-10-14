/**
 * The capped step variance records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped step variance is in its life cycle. */
export type CappedStepVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One capped step variance, with what the planners need to act on it. */
export class CappedStepVariance {
  code: string;
  title: string;
  startsAt: number;
  retries: number;
  description: string;
  quantity: number;
  status: CappedStepVarianceStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    retries: number,
    description: string,
    quantity: number,
    status: CappedStepVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.retries = retries;
    this.description = description;
    this.quantity = quantity;
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

  canMoveTo(next: CappedStepVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedStepVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped step variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.startsAt - this.retries) * 100) / 100;
  }

  copy(): CappedStepVariance {
    return new CappedStepVariance(
      this.code,
      this.title,
      this.startsAt,
      this.retries,
      this.description,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped step variance in status open. */
export function newCappedStepVariance(code: string, title: string): CappedStepVariance {
  return new CappedStepVariance(code, title, 0, 0, "", 0, "open");
}
