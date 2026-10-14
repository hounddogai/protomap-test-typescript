import * as text from "../../../../kit/text.js";

/** Where a scheduled bid rule checkpoint is in its life cycle. */
export type ScheduledBidRuleCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One scheduled bid rule checkpoint, with what the planners need to act on it. */
export class ScheduledBidRuleCheckpoint {
  code: string;
  name: string;
  cost: number;
  label: string;
  openRate: number;
  score: number;
  status: ScheduledBidRuleCheckpointStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    label: string,
    openRate: number,
    score: number,
    status: ScheduledBidRuleCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.label = label;
    this.openRate = openRate;
    this.score = score;
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

  canMoveTo(next: ScheduledBidRuleCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledBidRuleCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled bid rule checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled bid rule checkpoint"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.score - this.cost) * 100) / 100;
  }

  copy(): ScheduledBidRuleCheckpoint {
    return new ScheduledBidRuleCheckpoint(
      this.code,
      this.name,
      this.cost,
      this.label,
      this.openRate,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled bid rule checkpoint in status draft. */
export function newScheduledBidRuleCheckpoint(code: string, name: string): ScheduledBidRuleCheckpoint {
  return new ScheduledBidRuleCheckpoint(code, name, 0, "", 0, 0, "draft");
}
