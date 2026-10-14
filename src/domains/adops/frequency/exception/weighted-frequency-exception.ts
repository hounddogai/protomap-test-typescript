/**
 * The weighted frequency exception records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted frequency exception is in its life cycle. */
export type WeightedFrequencyExceptionStatus = "created" | "validated" | "published" | "retired";

/** One weighted frequency exception, with what the planners need to act on it. */
export class WeightedFrequencyException {
  code: string;
  label: string;
  ceiling: number;
  sendAt: number;
  cohort: string;
  campaignRef: string;
  weight: number;
  amount: number;
  status: WeightedFrequencyExceptionStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    sendAt: number,
    cohort: string,
    campaignRef: string,
    weight: number,
    amount: number,
    status: WeightedFrequencyExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.sendAt = sendAt;
    this.cohort = cohort;
    this.campaignRef = campaignRef;
    this.weight = weight;
    this.amount = amount;
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

  canMoveTo(next: WeightedFrequencyExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WeightedFrequencyExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted frequency exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round(this.amount * this.weight * 100) / 100;
  }

  copy(): WeightedFrequencyException {
    return new WeightedFrequencyException(
      this.code,
      this.label,
      this.ceiling,
      this.sendAt,
      this.cohort,
      this.campaignRef,
      this.weight,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted frequency exception in status created. */
export function newWeightedFrequencyException(code: string, label: string): WeightedFrequencyException {
  return new WeightedFrequencyException(code, label, 0, 0, "", "", 0, 0, "created");
}
