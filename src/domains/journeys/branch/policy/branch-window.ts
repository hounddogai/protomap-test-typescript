import * as text from "../../../../kit/text.js";

/** Where a branch window is in its life cycle. */
export type BranchWindowStatus = "created" | "validated" | "published" | "retired";

/** The record of a branch window and its current status. */
export class BranchWindow {
  code: string;
  name: string;
  unit: string;
  reviewer: string;
  active: boolean;
  expiresAt: number;
  description: string;
  timezone: string;
  durationMinutes: number;
  discount: number;
  archived: boolean;
  status: BranchWindowStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    reviewer: string,
    active: boolean,
    expiresAt: number,
    description: string,
    timezone: string,
    durationMinutes: number,
    discount: number,
    archived: boolean,
    status: BranchWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.reviewer = reviewer;
    this.active = active;
    this.expiresAt = expiresAt;
    this.description = description;
    this.timezone = timezone;
    this.durationMinutes = durationMinutes;
    this.discount = discount;
    this.archived = archived;
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

  canMoveTo(next: BranchWindowStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BranchWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedVolume(): number {
    return Math.round((this.expiresAt + this.discount) * 100) / 100;
  }

  copy(): BranchWindow {
    return new BranchWindow(
      this.code,
      this.name,
      this.unit,
      this.reviewer,
      this.active,
      this.expiresAt,
      this.description,
      this.timezone,
      this.durationMinutes,
      this.discount,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a branch window in status created. */
export function newBranchWindow(code: string, name: string): BranchWindow {
  return new BranchWindow(code, name, "", "", false, 0, "", "", 0, 0, false, "created");
}
