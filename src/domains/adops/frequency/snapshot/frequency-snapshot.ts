/**
 * The frequency snapshot records of adops's frequency work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a frequency snapshot is in its life cycle. */
export type FrequencySnapshotStatus = "created" | "validated" | "published" | "retired";

/** The record of a frequency snapshot and its current status. */
export class FrequencySnapshot {
  code: string;
  title: string;
  source: string;
  cohort: string;
  region: string;
  frequencyCap: number;
  campaignRef: string;
  status: FrequencySnapshotStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    cohort: string,
    region: string,
    frequencyCap: number,
    campaignRef: string,
    status: FrequencySnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.cohort = cohort;
    this.region = region;
    this.frequencyCap = frequencyCap;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: FrequencySnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FrequencySnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): FrequencySnapshot {
    return new FrequencySnapshot(
      this.code,
      this.title,
      this.source,
      this.cohort,
      this.region,
      this.frequencyCap,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a frequency snapshot in status created. */
export function newFrequencySnapshot(code: string, title: string): FrequencySnapshot {
  return new FrequencySnapshot(code, title, "", "", "", 0, "", "created");
}
