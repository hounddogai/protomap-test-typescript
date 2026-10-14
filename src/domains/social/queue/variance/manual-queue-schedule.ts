import * as text from "../../../../kit/text.js";

/** Where a manual queue schedule is in its life cycle. */
export type ManualQueueScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual queue schedule. Its code is unique within a tenant. */
export class ManualQueueSchedule {
  code: string;
  label: string;
  audienceId: string;
  version: number;
  bid: number;
  minimum: number;
  ownerId: string;
  margin: number;
  status: ManualQueueScheduleStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    version: number,
    bid: number,
    minimum: number,
    ownerId: string,
    margin: number,
    status: ManualQueueScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.version = version;
    this.bid = bid;
    this.minimum = minimum;
    this.ownerId = ownerId;
    this.margin = margin;
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

  canMoveTo(next: ManualQueueScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualQueueScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual queue schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"manual queue schedule"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.version - this.bid) * 100) / 100;
  }

  copy(): ManualQueueSchedule {
    return new ManualQueueSchedule(
      this.code,
      this.label,
      this.audienceId,
      this.version,
      this.bid,
      this.minimum,
      this.ownerId,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual queue schedule in status proposed. */
export function newManualQueueSchedule(code: string, label: string): ManualQueueSchedule {
  return new ManualQueueSchedule(code, label, "", 0, 0, 0, "", 0, "proposed");
}
