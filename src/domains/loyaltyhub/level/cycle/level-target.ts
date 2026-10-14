import * as text from "../../../../kit/text.js";

/** Where a level target is in its life cycle. */
export type LevelTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a level target and its current status. */
export class LevelTarget {
  code: string;
  label: string;
  maximum: number;
  weight: number;
  summary: string;
  endsAt: number;
  status: LevelTargetStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    weight: number,
    summary: string,
    endsAt: number,
    status: LevelTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.weight = weight;
    this.summary = summary;
    this.endsAt = endsAt;
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

  canMoveTo(next: LevelTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LevelTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"level target"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.endsAt - this.maximum) * 100) / 100;
  }

  copy(): LevelTarget {
    return new LevelTarget(this.code, this.label, this.maximum, this.weight, this.summary, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a level target in status planned. */
export function newLevelTarget(code: string, label: string): LevelTarget {
  return new LevelTarget(code, label, 0, 0, "", 0, "planned");
}
