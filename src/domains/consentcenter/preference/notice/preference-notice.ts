/**
 * The preference notice records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference notice is in its life cycle. */
export type PreferenceNoticeStatus = "created" | "validated" | "published" | "retired";

/** A preference notice. Its code is unique within a tenant. */
export class PreferenceNotice {
  code: string;
  name: string;
  currency: string;
  budget: number;
  channel: string;
  status: PreferenceNoticeStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    budget: number,
    channel: string,
    status: PreferenceNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.budget = budget;
    this.channel = channel;
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

  canMoveTo(next: PreferenceNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
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

  moveTo(next: PreferenceNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): PreferenceNotice {
    return new PreferenceNotice(this.code, this.name, this.currency, this.budget, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a preference notice in status created. */
export function newPreferenceNotice(code: string, name: string): PreferenceNotice {
  return new PreferenceNotice(code, name, "", 0, "", "created");
}
