import * as text from "../../../../kit/text.js";

/** Where a weighted invite target is in its life cycle. */
export type WeightedInviteTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted invite target as the invite team keeps it. */
export class WeightedInviteTarget {
  code: string;
  title: string;
  updatedAt: number;
  score: number;
  frequencyCap: number;
  status: WeightedInviteTargetStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    score: number,
    frequencyCap: number,
    status: WeightedInviteTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.score = score;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: WeightedInviteTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedInviteTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted invite target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round((this.frequencyCap - this.updatedAt) * 100) / 100;
  }

  copy(): WeightedInviteTarget {
    return new WeightedInviteTarget(this.code, this.title, this.updatedAt, this.score, this.frequencyCap, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted invite target in status planned. */
export function newWeightedInviteTarget(code: string, title: string): WeightedInviteTarget {
  return new WeightedInviteTarget(code, title, 0, 0, 0, "planned");
}
