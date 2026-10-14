import * as text from "../../../../kit/text.js";

/** Where a adaptive mention schedule is in its life cycle. */
export type AdaptiveMentionScheduleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a adaptive mention schedule and its current status. */
export class AdaptiveMentionSchedule {
  code: string;
  label: string;
  updatedAt: number;
  capacity: number;
  archived: boolean;
  visible: boolean;
  expiresAt: number;
  title: string;
  batchSize: number;
  pinned: boolean;
  status: AdaptiveMentionScheduleStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    capacity: number,
    archived: boolean,
    visible: boolean,
    expiresAt: number,
    title: string,
    batchSize: number,
    pinned: boolean,
    status: AdaptiveMentionScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.capacity = capacity;
    this.archived = archived;
    this.visible = visible;
    this.expiresAt = expiresAt;
    this.title = title;
    this.batchSize = batchSize;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveMentionScheduleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: AdaptiveMentionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive mention schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.expiresAt + this.updatedAt) * 100) / 100;
  }

  copy(): AdaptiveMentionSchedule {
    return new AdaptiveMentionSchedule(
      this.code,
      this.label,
      this.updatedAt,
      this.capacity,
      this.archived,
      this.visible,
      this.expiresAt,
      this.title,
      this.batchSize,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive mention schedule in status new. */
export function newAdaptiveMentionSchedule(code: string, label: string): AdaptiveMentionSchedule {
  return new AdaptiveMentionSchedule(code, label, 0, 0, false, false, 0, "", 0, false, "new");
}
