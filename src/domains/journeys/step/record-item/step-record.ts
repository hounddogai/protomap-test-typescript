/**
 * The step record records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step record is in its life cycle. */
export type StepRecordStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A step record. Its code is unique within a tenant. */
export class StepRecord {
  code: string;
  name: string;
  utmSource: string;
  attributes: Map<string, string>;
  maximum: number;
  ownerId: string;
  durationMinutes: number;
  graceDays: number;
  status: StepRecordStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    attributes: Map<string, string>,
    maximum: number,
    ownerId: string,
    durationMinutes: number,
    graceDays: number,
    status: StepRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.attributes = attributes;
    this.maximum = maximum;
    this.ownerId = ownerId;
    this.durationMinutes = durationMinutes;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: StepRecordStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"step record"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.maximum - this.graceDays) * 100) / 100;
  }

  copy(): StepRecord {
    return new StepRecord(
      this.code,
      this.name,
      this.utmSource,
      this.attributes,
      this.maximum,
      this.ownerId,
      this.durationMinutes,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a step record in status idle. */
export function newStepRecord(code: string, name: string): StepRecord {
  return new StepRecord(code, name, "", new Map<string, string>(), 0, "", 0, 0, "idle");
}
