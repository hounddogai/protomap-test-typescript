import * as text from "../../../../kit/text.js";

/** Where a level schedule is in its life cycle. */
export type LevelScheduleStatus = "created" | "validated" | "published" | "retired";

/** One level schedule, with what the planners need to act on it. */
export class LevelSchedule {
  code: string;
  name: string;
  createdAt: number;
  discount: number;
  label: string;
  country: string;
  approved: boolean;
  externalRef: string;
  status: LevelScheduleStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    discount: number,
    label: string,
    country: string,
    approved: boolean,
    externalRef: string,
    status: LevelScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.discount = discount;
    this.label = label;
    this.country = country;
    this.approved = approved;
    this.externalRef = externalRef;
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

  canMoveTo(next: LevelScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LevelScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.discount - this.createdAt) * 100) / 100;
  }

  copy(): LevelSchedule {
    return new LevelSchedule(
      this.code,
      this.name,
      this.createdAt,
      this.discount,
      this.label,
      this.country,
      this.approved,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a level schedule in status created. */
export function newLevelSchedule(code: string, name: string): LevelSchedule {
  return new LevelSchedule(code, name, 0, 0, "", "", false, "", "created");
}
