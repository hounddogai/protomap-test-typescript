import * as text from "../../../../kit/text.js";

/** Where a scheduled flight notice is in its life cycle. */
export type ScheduledFlightNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled flight notice. Its code is unique within a tenant. */
export class ScheduledFlightNotice {
  code: string;
  title: string;
  segment: string;
  ownerId: string;
  timezone: string;
  sequence: number;
  status: ScheduledFlightNoticeStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    ownerId: string,
    timezone: string,
    sequence: number,
    status: ScheduledFlightNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.ownerId = ownerId;
    this.timezone = timezone;
    this.sequence = sequence;
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

  canMoveTo(next: ScheduledFlightNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledFlightNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled flight notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): ScheduledFlightNotice {
    return new ScheduledFlightNotice(
      this.code,
      this.title,
      this.segment,
      this.ownerId,
      this.timezone,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled flight notice in status draft. */
export function newScheduledFlightNotice(code: string, title: string): ScheduledFlightNotice {
  return new ScheduledFlightNotice(code, title, "", "", "", 0, "draft");
}
