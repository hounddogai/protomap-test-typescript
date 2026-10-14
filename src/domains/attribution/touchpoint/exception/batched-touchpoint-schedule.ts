import * as text from "../../../../kit/text.js";

/** Where a batched touchpoint schedule is in its life cycle. */
export type BatchedTouchpointScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched touchpoint schedule, with what the planners need to act on it. */
export class BatchedTouchpointSchedule {
  code: string;
  title: string;
  active: boolean;
  segment: string;
  rate: number;
  capacity: number;
  checksum: string;
  campaignRef: string;
  reviewer: string;
  phone: string;
  region: string;
  status: BatchedTouchpointScheduleStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    segment: string,
    rate: number,
    capacity: number,
    checksum: string,
    campaignRef: string,
    reviewer: string,
    phone: string,
    region: string,
    status: BatchedTouchpointScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.segment = segment;
    this.rate = rate;
    this.capacity = capacity;
    this.checksum = checksum;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.phone = phone;
    this.region = region;
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

  canMoveTo(next: BatchedTouchpointScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedTouchpointScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched touchpoint schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.rate + this.capacity) * 100) / 100;
  }

  copy(): BatchedTouchpointSchedule {
    return new BatchedTouchpointSchedule(
      this.code,
      this.title,
      this.active,
      this.segment,
      this.rate,
      this.capacity,
      this.checksum,
      this.campaignRef,
      this.reviewer,
      this.phone,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched touchpoint schedule in status open. */
export function newBatchedTouchpointSchedule(code: string, title: string): BatchedTouchpointSchedule {
  return new BatchedTouchpointSchedule(code, title, false, "", 0, 0, "", "", "", "", "", "open");
}
