import * as text from "../../../../kit/text.js";

/** Where a weighted reply target is in its life cycle. */
export type WeightedReplyTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A weighted reply target. Its code is unique within a tenant. */
export class WeightedReplyTarget {
  code: string;
  name: string;
  attempts: number;
  windowDays: number;
  title: string;
  checksum: string;
  budget: number;
  ownerId: string;
  status: WeightedReplyTargetStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    windowDays: number,
    title: string,
    checksum: string,
    budget: number,
    ownerId: string,
    status: WeightedReplyTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.windowDays = windowDays;
    this.title = title;
    this.checksum = checksum;
    this.budget = budget;
    this.ownerId = ownerId;
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

  canMoveTo(next: WeightedReplyTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedReplyTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reply target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round((this.budget - this.attempts) * 100) / 100;
  }

  copy(): WeightedReplyTarget {
    return new WeightedReplyTarget(
      this.code,
      this.name,
      this.attempts,
      this.windowDays,
      this.title,
      this.checksum,
      this.budget,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted reply target in status draft. */
export function newWeightedReplyTarget(code: string, name: string): WeightedReplyTarget {
  return new WeightedReplyTarget(code, name, 0, 0, "", "", 0, "", "draft");
}
