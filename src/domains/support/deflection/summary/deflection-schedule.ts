import * as text from "../../../../kit/text.js";

/** Where a deflection schedule is in its life cycle. */
export type DeflectionScheduleStatus = "created" | "validated" | "published" | "retired";

/** The record of a deflection schedule and its current status. */
export class DeflectionSchedule {
  code: string;
  title: string;
  version: number;
  windowDays: number;
  createdAt: number;
  priority: number;
  batchSize: number;
  cost: number;
  status: DeflectionScheduleStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    windowDays: number,
    createdAt: number,
    priority: number,
    batchSize: number,
    cost: number,
    status: DeflectionScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.priority = priority;
    this.batchSize = batchSize;
    this.cost = cost;
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

  canMoveTo(next: DeflectionScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netLoad(): number {
    return Math.round((this.priority + this.version) * 100) / 100;
  }

  copy(): DeflectionSchedule {
    return new DeflectionSchedule(
      this.code,
      this.title,
      this.version,
      this.windowDays,
      this.createdAt,
      this.priority,
      this.batchSize,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a deflection schedule in status created. */
export function newDeflectionSchedule(code: string, title: string): DeflectionSchedule {
  return new DeflectionSchedule(code, title, 0, 0, 0, 0, 0, 0, "created");
}
