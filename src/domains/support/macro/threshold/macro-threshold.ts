/**
 * The macro threshold records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro threshold is in its life cycle. */
export type MacroThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** A macro threshold. Its code is unique within a tenant. */
export class MacroThreshold {
  code: string;
  title: string;
  limit: number;
  startsAt: number;
  locale: string;
  revision: number;
  rate: number;
  notes: string;
  status: MacroThresholdStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    startsAt: number,
    locale: string,
    revision: number,
    rate: number,
    notes: string,
    status: MacroThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.startsAt = startsAt;
    this.locale = locale;
    this.revision = revision;
    this.rate = rate;
    this.notes = notes;
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

  canMoveTo(next: MacroThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: MacroThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"macro threshold"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.revision - this.rate) * 100) / 100;
  }

  copy(): MacroThreshold {
    return new MacroThreshold(
      this.code,
      this.title,
      this.limit,
      this.startsAt,
      this.locale,
      this.revision,
      this.rate,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a macro threshold in status requested. */
export function newMacroThreshold(code: string, title: string): MacroThreshold {
  return new MacroThreshold(code, title, 0, 0, "", 0, 0, "", "requested");
}
