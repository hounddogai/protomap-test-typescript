/**
 * The weighted mention exception records of social's mention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted mention exception is in its life cycle. */
export type WeightedMentionExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted mention exception, with what the planners need to act on it. */
export class WeightedMentionException {
  code: string;
  label: string;
  title: string;
  margin: number;
  timezone: string;
  phone: string;
  ownerId: string;
  conversionRate: number;
  budget: number;
  status: WeightedMentionExceptionStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    margin: number,
    timezone: string,
    phone: string,
    ownerId: string,
    conversionRate: number,
    budget: number,
    status: WeightedMentionExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.margin = margin;
    this.timezone = timezone;
    this.phone = phone;
    this.ownerId = ownerId;
    this.conversionRate = conversionRate;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedMentionExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedMentionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted mention exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted mention exception"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.budget + this.conversionRate) * 100) / 100;
  }

  copy(): WeightedMentionException {
    return new WeightedMentionException(
      this.code,
      this.label,
      this.title,
      this.margin,
      this.timezone,
      this.phone,
      this.ownerId,
      this.conversionRate,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted mention exception in status new. */
export function newWeightedMentionException(code: string, label: string): WeightedMentionException {
  return new WeightedMentionException(code, label, "", 0, "", "", "", 0, 0, "new");
}
