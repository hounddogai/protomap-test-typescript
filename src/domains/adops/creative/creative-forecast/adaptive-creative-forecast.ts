/**
 * The adaptive creative forecast records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive creative forecast is in its life cycle. */
export type AdaptiveCreativeForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive creative forecast. Its code is unique within a tenant. */
export class AdaptiveCreativeForecast {
  code: string;
  name: string;
  retries: number;
  phone: string;
  amount: number;
  segment: string;
  status: AdaptiveCreativeForecastStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    phone: string,
    amount: number,
    segment: string,
    status: AdaptiveCreativeForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.phone = phone;
    this.amount = amount;
    this.segment = segment;
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

  canMoveTo(next: AdaptiveCreativeForecastStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveCreativeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive creative forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.retries + this.amount) * 100) / 100;
  }

  copy(): AdaptiveCreativeForecast {
    return new AdaptiveCreativeForecast(
      this.code,
      this.name,
      this.retries,
      this.phone,
      this.amount,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a adaptive creative forecast in status new. */
export function newAdaptiveCreativeForecast(code: string, name: string): AdaptiveCreativeForecast {
  return new AdaptiveCreativeForecast(code, name, 0, "", 0, "", "new");
}
