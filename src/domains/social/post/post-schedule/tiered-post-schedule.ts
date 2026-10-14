/**
 * The tiered post schedule records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered post schedule is in its life cycle. */
export type TieredPostScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered post schedule as the post team keeps it. */
export class TieredPostSchedule {
  code: string;
  name: string;
  startsAt: number;
  summary: string;
  margin: number;
  version: number;
  source: string;
  label: string;
  cohort: string;
  status: TieredPostScheduleStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    summary: string,
    margin: number,
    version: number,
    source: string,
    label: string,
    cohort: string,
    status: TieredPostScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.summary = summary;
    this.margin = margin;
    this.version = version;
    this.source = source;
    this.label = label;
    this.cohort = cohort;
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

  canMoveTo(next: TieredPostScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPostScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered post schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.margin + this.version) * 100) / 100;
  }

  copy(): TieredPostSchedule {
    return new TieredPostSchedule(
      this.code,
      this.name,
      this.startsAt,
      this.summary,
      this.margin,
      this.version,
      this.source,
      this.label,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered post schedule in status requested. */
export function newTieredPostSchedule(code: string, name: string): TieredPostSchedule {
  return new TieredPostSchedule(code, name, 0, "", 0, 0, "", "", "", "requested");
}
