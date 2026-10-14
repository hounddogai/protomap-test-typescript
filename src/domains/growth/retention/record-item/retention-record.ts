/**
 * The retention record records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention record is in its life cycle. */
export type RetentionRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A retention record as the retention team keeps it. */
export class RetentionRecord {
  code: string;
  label: string;
  timezone: string;
  minimum: number;
  endsAt: number;
  clicks: number;
  journeyId: string;
  channel: string;
  name: string;
  status: RetentionRecordStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    minimum: number,
    endsAt: number,
    clicks: number,
    journeyId: string,
    channel: string,
    name: string,
    status: RetentionRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.clicks = clicks;
    this.journeyId = journeyId;
    this.channel = channel;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.minimum + this.endsAt) * 100) / 100;
  }

  copy(): RetentionRecord {
    return new RetentionRecord(
      this.code,
      this.label,
      this.timezone,
      this.minimum,
      this.endsAt,
      this.clicks,
      this.journeyId,
      this.channel,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a retention record in status draft. */
export function newRetentionRecord(code: string, label: string): RetentionRecord {
  return new RetentionRecord(code, label, "", 0, 0, 0, "", "", "", "draft");
}
