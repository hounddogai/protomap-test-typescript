import * as text from "../../../../kit/text.js";

/** Where a scheduled queue rollup is in its life cycle. */
export type ScheduledQueueRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled queue rollup. Its code is unique within a tenant. */
export class ScheduledQueueRollup {
  code: string;
  title: string;
  channel: string;
  discount: number;
  margin: number;
  openRate: number;
  durationMinutes: number;
  cohort: string;
  capacity: number;
  status: ScheduledQueueRollupStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    discount: number,
    margin: number,
    openRate: number,
    durationMinutes: number,
    cohort: string,
    capacity: number,
    status: ScheduledQueueRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.discount = discount;
    this.margin = margin;
    this.openRate = openRate;
    this.durationMinutes = durationMinutes;
    this.cohort = cohort;
    this.capacity = capacity;
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

  canMoveTo(next: ScheduledQueueRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ScheduledQueueRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled queue rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedLoad(): number {
    return Math.round((this.capacity - this.margin) * 100) / 100;
  }

  copy(): ScheduledQueueRollup {
    return new ScheduledQueueRollup(
      this.code,
      this.title,
      this.channel,
      this.discount,
      this.margin,
      this.openRate,
      this.durationMinutes,
      this.cohort,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled queue rollup in status planned. */
export function newScheduledQueueRollup(code: string, title: string): ScheduledQueueRollup {
  return new ScheduledQueueRollup(code, title, "", 0, 0, 0, 0, "", 0, "planned");
}
