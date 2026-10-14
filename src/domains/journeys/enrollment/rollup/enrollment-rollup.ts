/**
 * The enrollment rollup records of journeys's enrollment work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment rollup is in its life cycle. */
export type EnrollmentRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** A enrollment rollup as the enrollment team keeps it. */
export class EnrollmentRollup {
  code: string;
  title: string;
  channel: string;
  expiresAt: number;
  graceDays: number;
  label: string;
  category: string;
  frequencyCap: number;
  status: EnrollmentRollupStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    expiresAt: number,
    graceDays: number,
    label: string,
    category: string,
    frequencyCap: number,
    status: EnrollmentRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.graceDays = graceDays;
    this.label = label;
    this.category = category;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: EnrollmentRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  netTotal(): number {
    return Math.round((this.frequencyCap + this.graceDays) * 100) / 100;
  }

  copy(): EnrollmentRollup {
    return new EnrollmentRollup(
      this.code,
      this.title,
      this.channel,
      this.expiresAt,
      this.graceDays,
      this.label,
      this.category,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a enrollment rollup in status requested. */
export function newEnrollmentRollup(code: string, title: string): EnrollmentRollup {
  return new EnrollmentRollup(code, title, "", 0, 0, "", "", 0, "requested");
}
