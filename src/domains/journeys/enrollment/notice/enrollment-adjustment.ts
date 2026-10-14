import * as text from "../../../../kit/text.js";

/** Where a enrollment adjustment is in its life cycle. */
export type EnrollmentAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a enrollment adjustment and its current status. */
export class EnrollmentAdjustment {
  code: string;
  title: string;
  archived: boolean;
  score: number;
  phone: string;
  revision: number;
  floorValue: number;
  capacity: number;
  sendAt: number;
  frequencyCap: number;
  active: boolean;
  status: EnrollmentAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    score: number,
    phone: string,
    revision: number,
    floorValue: number,
    capacity: number,
    sendAt: number,
    frequencyCap: number,
    active: boolean,
    status: EnrollmentAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.score = score;
    this.phone = phone;
    this.revision = revision;
    this.floorValue = floorValue;
    this.capacity = capacity;
    this.sendAt = sendAt;
    this.frequencyCap = frequencyCap;
    this.active = active;
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

  canMoveTo(next: EnrollmentAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"enrollment adjustment"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.capacity + this.score) * 100) / 100;
  }

  copy(): EnrollmentAdjustment {
    return new EnrollmentAdjustment(
      this.code,
      this.title,
      this.archived,
      this.score,
      this.phone,
      this.revision,
      this.floorValue,
      this.capacity,
      this.sendAt,
      this.frequencyCap,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a enrollment adjustment in status new. */
export function newEnrollmentAdjustment(code: string, title: string): EnrollmentAdjustment {
  return new EnrollmentAdjustment(code, title, false, 0, "", 0, 0, 0, 0, 0, false, "new");
}
