/**
 * The weighted reputation exception records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted reputation exception is in its life cycle. */
export type WeightedReputationExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One weighted reputation exception, with what the planners need to act on it. */
export class WeightedReputationException {
  code: string;
  label: string;
  timezone: string;
  ratio: number;
  discount: number;
  status: WeightedReputationExceptionStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    ratio: number,
    discount: number,
    status: WeightedReputationExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.ratio = ratio;
    this.discount = discount;
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

  canMoveTo(next: WeightedReputationExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedReputationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reputation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.ratio + this.discount) * 100) / 100;
  }

  copy(): WeightedReputationException {
    return new WeightedReputationException(
      this.code,
      this.label,
      this.timezone,
      this.ratio,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted reputation exception in status open. */
export function newWeightedReputationException(code: string, label: string): WeightedReputationException {
  return new WeightedReputationException(code, label, "", 0, 0, "open");
}
