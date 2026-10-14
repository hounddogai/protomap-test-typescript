import * as text from "../../../../kit/text.js";

/** Where a rolling queue target is in its life cycle. */
export type RollingQueueTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling queue target as the queue team keeps it. */
export class RollingQueueTarget {
  code: string;
  label: string;
  segment: string;
  priority: number;
  externalRef: string;
  batchSize: number;
  cost: number;
  status: RollingQueueTargetStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    priority: number,
    externalRef: string,
    batchSize: number,
    cost: number,
    status: RollingQueueTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.priority = priority;
    this.externalRef = externalRef;
    this.batchSize = batchSize;
    this.cost = cost;
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

  canMoveTo(next: RollingQueueTargetStatus): boolean {
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
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingQueueTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling queue target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"rolling queue target"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.batchSize + this.priority) * 100) / 100;
  }

  copy(): RollingQueueTarget {
    return new RollingQueueTarget(
      this.code,
      this.label,
      this.segment,
      this.priority,
      this.externalRef,
      this.batchSize,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a rolling queue target in status proposed. */
export function newRollingQueueTarget(code: string, label: string): RollingQueueTarget {
  return new RollingQueueTarget(code, label, "", 0, "", 0, 0, "proposed");
}
