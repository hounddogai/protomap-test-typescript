import * as text from "../../../../kit/text.js";

/** Where a queue metric is in its life cycle. */
export type QueueMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a queue metric and its current status. */
export class QueueMetric {
  code: string;
  name: string;
  timezone: string;
  capacity: number;
  startsAt: number;
  priority: number;
  approved: boolean;
  archived: boolean;
  frequencyCap: number;
  expiresAt: number;
  status: QueueMetricStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    capacity: number,
    startsAt: number,
    priority: number,
    approved: boolean,
    archived: boolean,
    frequencyCap: number,
    expiresAt: number,
    status: QueueMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.capacity = capacity;
    this.startsAt = startsAt;
    this.priority = priority;
    this.approved = approved;
    this.archived = archived;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: QueueMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: QueueMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.expiresAt - this.startsAt) * 100) / 100;
  }

  copy(): QueueMetric {
    return new QueueMetric(
      this.code,
      this.name,
      this.timezone,
      this.capacity,
      this.startsAt,
      this.priority,
      this.approved,
      this.archived,
      this.frequencyCap,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a queue metric in status planned. */
export function newQueueMetric(code: string, name: string): QueueMetric {
  return new QueueMetric(code, name, "", 0, 0, 0, false, false, 0, 0, "planned");
}
