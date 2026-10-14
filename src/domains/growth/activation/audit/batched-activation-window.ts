import * as text from "../../../../kit/text.js";

/** Where a batched activation window is in its life cycle. */
export type BatchedActivationWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a batched activation window and its current status. */
export class BatchedActivationWindow {
  code: string;
  label: string;
  cost: number;
  variant: string;
  updatedAt: number;
  segment: string;
  clicks: number;
  visible: boolean;
  status: BatchedActivationWindowStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    variant: string,
    updatedAt: number,
    segment: string,
    clicks: number,
    visible: boolean,
    status: BatchedActivationWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.variant = variant;
    this.updatedAt = updatedAt;
    this.segment = segment;
    this.clicks = clicks;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedActivationWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedActivationWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched activation window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"batched activation window"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.cost + this.clicks) * 100) / 100;
  }

  copy(): BatchedActivationWindow {
    return new BatchedActivationWindow(
      this.code,
      this.label,
      this.cost,
      this.variant,
      this.updatedAt,
      this.segment,
      this.clicks,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched activation window in status draft. */
export function newBatchedActivationWindow(code: string, label: string): BatchedActivationWindow {
  return new BatchedActivationWindow(code, label, 0, "", 0, "", 0, false, "draft");
}
