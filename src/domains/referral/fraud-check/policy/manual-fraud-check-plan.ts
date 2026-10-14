import * as text from "../../../../kit/text.js";

/** Where a manual fraud check plan is in its life cycle. */
export type ManualFraudCheckPlanStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual fraud check plan as the fraud check team keeps it. */
export class ManualFraudCheckPlan {
  code: string;
  title: string;
  quantity: number;
  tags: string[];
  threshold: number;
  startsAt: number;
  floorValue: number;
  capacity: number;
  status: ManualFraudCheckPlanStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    tags: string[],
    threshold: number,
    startsAt: number,
    floorValue: number,
    capacity: number,
    status: ManualFraudCheckPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.tags = tags;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.floorValue = floorValue;
    this.capacity = capacity;
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

  canMoveTo(next: ManualFraudCheckPlanStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualFraudCheckPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual fraud check plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.floorValue + this.quantity) * 100) / 100;
  }

  copy(): ManualFraudCheckPlan {
    return new ManualFraudCheckPlan(
      this.code,
      this.title,
      this.quantity,
      this.tags,
      this.threshold,
      this.startsAt,
      this.floorValue,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual fraud check plan in status new. */
export function newManualFraudCheckPlan(code: string, title: string): ManualFraudCheckPlan {
  return new ManualFraudCheckPlan(code, title, 0, [], 0, 0, 0, 0, "new");
}
