/**
 * The global reward entry records of loyaltyhub's reward work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global reward entry is in its life cycle. */
export type GlobalRewardEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a global reward entry and its current status. */
export class GlobalRewardEntry {
  code: string;
  name: string;
  locale: string;
  clicks: number;
  variant: string;
  version: number;
  minimum: number;
  endsAt: number;
  status: GlobalRewardEntryStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    clicks: number,
    variant: string,
    version: number,
    minimum: number,
    endsAt: number,
    status: GlobalRewardEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.clicks = clicks;
    this.variant = variant;
    this.version = version;
    this.minimum = minimum;
    this.endsAt = endsAt;
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

  canMoveTo(next: GlobalRewardEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalRewardEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.clicks - this.minimum) * 100) / 100;
  }

  copy(): GlobalRewardEntry {
    return new GlobalRewardEntry(
      this.code,
      this.name,
      this.locale,
      this.clicks,
      this.variant,
      this.version,
      this.minimum,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global reward entry in status open. */
export function newGlobalRewardEntry(code: string, name: string): GlobalRewardEntry {
  return new GlobalRewardEntry(code, name, "", 0, "", 0, 0, 0, "open");
}
