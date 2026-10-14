/**
 * The macro record records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro record is in its life cycle. */
export type MacroRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** One macro record, with what the planners need to act on it. */
export class MacroRecord {
  code: string;
  label: string;
  summary: string;
  externalRef: string;
  timezone: string;
  region: string;
  windowDays: number;
  locale: string;
  segment: string;
  createdAt: number;
  status: MacroRecordStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    externalRef: string,
    timezone: string,
    region: string,
    windowDays: number,
    locale: string,
    segment: string,
    createdAt: number,
    status: MacroRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.externalRef = externalRef;
    this.timezone = timezone;
    this.region = region;
    this.windowDays = windowDays;
    this.locale = locale;
    this.segment = segment;
    this.createdAt = createdAt;
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

  canMoveTo(next: MacroRecordStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: MacroRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netLoad(): number {
    return Math.round(this.createdAt * this.windowDays * 100) / 100;
  }

  copy(): MacroRecord {
    return new MacroRecord(
      this.code,
      this.label,
      this.summary,
      this.externalRef,
      this.timezone,
      this.region,
      this.windowDays,
      this.locale,
      this.segment,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a macro record in status new. */
export function newMacroRecord(code: string, label: string): MacroRecord {
  return new MacroRecord(code, label, "", "", "", "", 0, "", "", 0, "new");
}
