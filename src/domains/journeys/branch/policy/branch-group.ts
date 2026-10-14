import * as text from "../../../../kit/text.js";

/** Where a branch group is in its life cycle. */
export type BranchGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A branch group as the branch team keeps it. */
export class BranchGroup {
  code: string;
  title: string;
  score: number;
  sendAt: number;
  cohort: string;
  durationMinutes: number;
  budget: number;
  active: boolean;
  status: BranchGroupStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    sendAt: number,
    cohort: string,
    durationMinutes: number,
    budget: number,
    active: boolean,
    status: BranchGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.sendAt = sendAt;
    this.cohort = cohort;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.active = active;
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

  canMoveTo(next: BranchGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BranchGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.score + this.sendAt) * 100) / 100;
  }

  copy(): BranchGroup {
    return new BranchGroup(
      this.code,
      this.title,
      this.score,
      this.sendAt,
      this.cohort,
      this.durationMinutes,
      this.budget,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a branch group in status draft. */
export function newBranchGroup(code: string, title: string): BranchGroup {
  return new BranchGroup(code, title, 0, 0, "", 0, 0, false, "draft");
}
