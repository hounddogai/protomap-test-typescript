/**
 * The rolling macro record records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling macro record is in its life cycle. */
export type RollingMacroRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One rolling macro record, with what the planners need to act on it. */
export class RollingMacroRecord {
  code: string;
  name: string;
  priority: number;
  clicks: number;
  durationMinutes: number;
  tags: string[];
  minimum: number;
  externalRef: string;
  retries: number;
  status: RollingMacroRecordStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    clicks: number,
    durationMinutes: number,
    tags: string[],
    minimum: number,
    externalRef: string,
    retries: number,
    status: RollingMacroRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.clicks = clicks;
    this.durationMinutes = durationMinutes;
    this.tags = tags;
    this.minimum = minimum;
    this.externalRef = externalRef;
    this.retries = retries;
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

  canMoveTo(next: RollingMacroRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingMacroRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling macro record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.priority + this.clicks) * 100) / 100;
  }

  copy(): RollingMacroRecord {
    return new RollingMacroRecord(
      this.code,
      this.name,
      this.priority,
      this.clicks,
      this.durationMinutes,
      this.tags,
      this.minimum,
      this.externalRef,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling macro record in status proposed. */
export function newRollingMacroRecord(code: string, name: string): RollingMacroRecord {
  return new RollingMacroRecord(code, name, 0, 0, 0, [], 0, "", 0, "proposed");
}
