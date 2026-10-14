import * as text from "../../../../kit/text.js";

/** Where a challenge target is in its life cycle. */
export type ChallengeTargetStatus = "created" | "validated" | "published" | "retired";

/** A challenge target as the challenge team keeps it. */
export class ChallengeTarget {
  code: string;
  name: string;
  batchSize: number;
  cost: number;
  discount: number;
  status: ChallengeTargetStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    cost: number,
    discount: number,
    status: ChallengeTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.cost = cost;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeTargetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ChallengeTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.discount + this.cost) * 100) / 100;
  }

  copy(): ChallengeTarget {
    return new ChallengeTarget(this.code, this.name, this.batchSize, this.cost, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a challenge target in status created. */
export function newChallengeTarget(code: string, name: string): ChallengeTarget {
  return new ChallengeTarget(code, name, 0, 0, 0, "created");
}
