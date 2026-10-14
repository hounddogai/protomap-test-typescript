import * as text from "../../../../kit/text.js";

/** Where a scheduled cohort schedule is in its life cycle. */
export type ScheduledCohortScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled cohort schedule. Its code is unique within a tenant. */
export class ScheduledCohortSchedule {
  code: string;
  label: string;
  ownerId: string;
  capacity: number;
  budget: number;
  tags: string[];
  version: number;
  unit: string;
  checksum: string;
  campaignRef: string;
  quantity: number;
  status: ScheduledCohortScheduleStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    capacity: number,
    budget: number,
    tags: string[],
    version: number,
    unit: string,
    checksum: string,
    campaignRef: string,
    quantity: number,
    status: ScheduledCohortScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.capacity = capacity;
    this.budget = budget;
    this.tags = tags;
    this.version = version;
    this.unit = unit;
    this.checksum = checksum;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
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

  canMoveTo(next: ScheduledCohortScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledCohortScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled cohort schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"scheduled cohort schedule"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round(this.budget * this.quantity * 100) / 100;
  }

  copy(): ScheduledCohortSchedule {
    return new ScheduledCohortSchedule(
      this.code,
      this.label,
      this.ownerId,
      this.capacity,
      this.budget,
      this.tags,
      this.version,
      this.unit,
      this.checksum,
      this.campaignRef,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled cohort schedule in status draft. */
export function newScheduledCohortSchedule(code: string, label: string): ScheduledCohortSchedule {
  return new ScheduledCohortSchedule(code, label, "", 0, 0, [], 0, "", "", "", 0, "draft");
}
