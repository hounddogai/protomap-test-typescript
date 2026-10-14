import * as text from "../../../../kit/text.js";

/** Where a manual subscription segment is in its life cycle. */
export type ManualSubscriptionSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual subscription segment as the subscription team keeps it. */
export class ManualSubscriptionSegment {
  code: string;
  title: string;
  ceiling: number;
  version: number;
  visible: boolean;
  cost: number;
  floorValue: number;
  status: ManualSubscriptionSegmentStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    version: number,
    visible: boolean,
    cost: number,
    floorValue: number,
    status: ManualSubscriptionSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.version = version;
    this.visible = visible;
    this.cost = cost;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualSubscriptionSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualSubscriptionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual subscription segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.floorValue - this.ceiling) * 100) / 100;
  }

  copy(): ManualSubscriptionSegment {
    return new ManualSubscriptionSegment(
      this.code,
      this.title,
      this.ceiling,
      this.version,
      this.visible,
      this.cost,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual subscription segment in status proposed. */
export function newManualSubscriptionSegment(code: string, title: string): ManualSubscriptionSegment {
  return new ManualSubscriptionSegment(code, title, 0, 0, false, 0, 0, "proposed");
}
