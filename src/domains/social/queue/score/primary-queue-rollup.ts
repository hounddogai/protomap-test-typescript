import * as text from "../../../../kit/text.js";

/** Where a primary queue rollup is in its life cycle. */
export type PrimaryQueueRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One primary queue rollup, with what the planners need to act on it. */
export class PrimaryQueueRollup {
  code: string;
  title: string;
  retries: number;
  approved: boolean;
  impressions: number;
  status: PrimaryQueueRollupStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    approved: boolean,
    impressions: number,
    status: PrimaryQueueRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.approved = approved;
    this.impressions = impressions;
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

  canMoveTo(next: PrimaryQueueRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: PrimaryQueueRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary queue rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.retries - this.impressions) * 100) / 100;
  }

  copy(): PrimaryQueueRollup {
    return new PrimaryQueueRollup(this.code, this.title, this.retries, this.approved, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary queue rollup in status draft. */
export function newPrimaryQueueRollup(code: string, title: string): PrimaryQueueRollup {
  return new PrimaryQueueRollup(code, title, 0, false, 0, "draft");
}
