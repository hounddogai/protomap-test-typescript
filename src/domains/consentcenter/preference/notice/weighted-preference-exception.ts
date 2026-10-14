import * as text from "../../../../kit/text.js";

/** Where a weighted preference exception is in its life cycle. */
export type WeightedPreferenceExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a weighted preference exception and its current status. */
export class WeightedPreferenceException {
  code: string;
  label: string;
  retries: number;
  locale: string;
  externalRef: string;
  conversionRate: number;
  pinned: boolean;
  capacity: number;
  budget: number;
  expiresAt: number;
  limit: number;
  status: WeightedPreferenceExceptionStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    locale: string,
    externalRef: string,
    conversionRate: number,
    pinned: boolean,
    capacity: number,
    budget: number,
    expiresAt: number,
    limit: number,
    status: WeightedPreferenceExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.locale = locale;
    this.externalRef = externalRef;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
    this.capacity = capacity;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedPreferenceExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedPreferenceExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted preference exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netValue(): number {
    return Math.round(this.capacity * this.budget * 100) / 100;
  }

  copy(): WeightedPreferenceException {
    return new WeightedPreferenceException(
      this.code,
      this.label,
      this.retries,
      this.locale,
      this.externalRef,
      this.conversionRate,
      this.pinned,
      this.capacity,
      this.budget,
      this.expiresAt,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted preference exception in status draft. */
export function newWeightedPreferenceException(code: string, label: string): WeightedPreferenceException {
  return new WeightedPreferenceException(code, label, 0, "", "", 0, false, 0, 0, 0, 0, "draft");
}
