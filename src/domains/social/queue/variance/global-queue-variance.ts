/**
 * The global queue variance records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global queue variance is in its life cycle. */
export type GlobalQueueVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a global queue variance and its current status. */
export class GlobalQueueVariance {
  code: string;
  label: string;
  contactEmail: string;
  maximum: number;
  country: string;
  attempts: number;
  graceDays: number;
  frequencyCap: number;
  floorValue: number;
  status: GlobalQueueVarianceStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    maximum: number,
    country: string,
    attempts: number,
    graceDays: number,
    frequencyCap: number,
    floorValue: number,
    status: GlobalQueueVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.maximum = maximum;
    this.country = country;
    this.attempts = attempts;
    this.graceDays = graceDays;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
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

  canMoveTo(next: GlobalQueueVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalQueueVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global queue variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.maximum * this.frequencyCap * 100) / 100;
  }

  copy(): GlobalQueueVariance {
    return new GlobalQueueVariance(
      this.code,
      this.label,
      this.contactEmail,
      this.maximum,
      this.country,
      this.attempts,
      this.graceDays,
      this.frequencyCap,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global queue variance in status proposed. */
export function newGlobalQueueVariance(code: string, label: string): GlobalQueueVariance {
  return new GlobalQueueVariance(code, label, "", 0, "", 0, 0, 0, 0, "proposed");
}
