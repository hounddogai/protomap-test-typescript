import * as text from "../../../../kit/text.js";

/** Where a pending level threshold is in its life cycle. */
export type PendingLevelThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending level threshold and its current status. */
export class PendingLevelThreshold {
  code: string;
  title: string;
  score: number;
  endsAt: number;
  revision: number;
  country: string;
  floorValue: number;
  cost: number;
  discount: number;
  capacity: number;
  status: PendingLevelThresholdStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    endsAt: number,
    revision: number,
    country: string,
    floorValue: number,
    cost: number,
    discount: number,
    capacity: number,
    status: PendingLevelThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.endsAt = endsAt;
    this.revision = revision;
    this.country = country;
    this.floorValue = floorValue;
    this.cost = cost;
    this.discount = discount;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingLevelThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingLevelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending level threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.discount * this.capacity * 100) / 100;
  }

  copy(): PendingLevelThreshold {
    return new PendingLevelThreshold(
      this.code,
      this.title,
      this.score,
      this.endsAt,
      this.revision,
      this.country,
      this.floorValue,
      this.cost,
      this.discount,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending level threshold in status open. */
export function newPendingLevelThreshold(code: string, title: string): PendingLevelThreshold {
  return new PendingLevelThreshold(code, title, 0, 0, 0, "", 0, 0, 0, 0, "open");
}
