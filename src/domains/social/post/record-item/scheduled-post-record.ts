/**
 * The scheduled post record records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled post record is in its life cycle. */
export type ScheduledPostRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled post record as the post team keeps it. */
export class ScheduledPostRecord {
  code: string;
  label: string;
  batchSize: number;
  openRate: number;
  campaignRef: string;
  frequencyCap: number;
  tags: string[];
  checksum: string;
  timezone: string;
  status: ScheduledPostRecordStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    openRate: number,
    campaignRef: string,
    frequencyCap: number,
    tags: string[],
    checksum: string,
    timezone: string,
    status: ScheduledPostRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.tags = tags;
    this.checksum = checksum;
    this.timezone = timezone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledPostRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledPostRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled post record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.frequencyCap - this.openRate) * 100) / 100;
  }

  copy(): ScheduledPostRecord {
    return new ScheduledPostRecord(
      this.code,
      this.label,
      this.batchSize,
      this.openRate,
      this.campaignRef,
      this.frequencyCap,
      this.tags,
      this.checksum,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled post record in status planned. */
export function newScheduledPostRecord(code: string, label: string): ScheduledPostRecord {
  return new ScheduledPostRecord(code, label, 0, 0, "", 0, [], "", "", "planned");
}
