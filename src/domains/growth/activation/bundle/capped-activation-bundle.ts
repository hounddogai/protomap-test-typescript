/**
 * The capped activation bundle records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped activation bundle is in its life cycle. */
export type CappedActivationBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped activation bundle. Its code is unique within a tenant. */
export class CappedActivationBundle {
  code: string;
  name: string;
  utmSource: string;
  currency: string;
  timezone: string;
  score: number;
  status: CappedActivationBundleStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    currency: string,
    timezone: string,
    score: number,
    status: CappedActivationBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.currency = currency;
    this.timezone = timezone;
    this.score = score;
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

  canMoveTo(next: CappedActivationBundleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedActivationBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped activation bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): CappedActivationBundle {
    return new CappedActivationBundle(
      this.code,
      this.name,
      this.utmSource,
      this.currency,
      this.timezone,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a capped activation bundle in status new. */
export function newCappedActivationBundle(code: string, name: string): CappedActivationBundle {
  return new CappedActivationBundle(code, name, "", "", "", 0, "new");
}
