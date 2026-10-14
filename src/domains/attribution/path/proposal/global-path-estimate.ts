import * as text from "../../../../kit/text.js";

/** Where a global path estimate is in its life cycle. */
export type GlobalPathEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global path estimate. Its code is unique within a tenant. */
export class GlobalPathEstimate {
  code: string;
  title: string;
  startsAt: number;
  cost: number;
  openRate: number;
  status: GlobalPathEstimateStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    cost: number,
    openRate: number,
    status: GlobalPathEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.cost = cost;
    this.openRate = openRate;
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

  canMoveTo(next: GlobalPathEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalPathEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global path estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global path estimate"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.startsAt * this.openRate * 100) / 100;
  }

  copy(): GlobalPathEstimate {
    return new GlobalPathEstimate(this.code, this.title, this.startsAt, this.cost, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global path estimate in status planned. */
export function newGlobalPathEstimate(code: string, title: string): GlobalPathEstimate {
  return new GlobalPathEstimate(code, title, 0, 0, 0, "planned");
}
