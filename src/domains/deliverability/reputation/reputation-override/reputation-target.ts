import * as text from "../../../../kit/text.js";

/** Where a reputation target is in its life cycle. */
export type ReputationTargetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A reputation target as the reputation team keeps it. */
export class ReputationTarget {
  code: string;
  title: string;
  retries: number;
  ceiling: number;
  maximum: number;
  status: ReputationTargetStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    ceiling: number,
    maximum: number,
    status: ReputationTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.ceiling = ceiling;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationTargetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ReputationTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.maximum + this.ceiling) * 100) / 100;
  }

  copy(): ReputationTarget {
    return new ReputationTarget(this.code, this.title, this.retries, this.ceiling, this.maximum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reputation target in status open. */
export function newReputationTarget(code: string, title: string): ReputationTarget {
  return new ReputationTarget(code, title, 0, 0, 0, "open");
}
