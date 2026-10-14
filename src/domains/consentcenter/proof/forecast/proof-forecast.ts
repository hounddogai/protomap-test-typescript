/**
 * The proof forecast records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof forecast is in its life cycle. */
export type ProofForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** One proof forecast, with what the planners need to act on it. */
export class ProofForecast {
  code: string;
  name: string;
  graceDays: number;
  discount: number;
  region: string;
  locale: string;
  status: ProofForecastStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    discount: number,
    region: string,
    locale: string,
    status: ProofForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.discount = discount;
    this.region = region;
    this.locale = locale;
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

  canMoveTo(next: ProofForecastStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ProofForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round(this.discount * this.graceDays * 100) / 100;
  }

  copy(): ProofForecast {
    return new ProofForecast(
      this.code,
      this.name,
      this.graceDays,
      this.discount,
      this.region,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a proof forecast in status new. */
export function newProofForecast(code: string, name: string): ProofForecast {
  return new ProofForecast(code, name, 0, 0, "", "", "new");
}
