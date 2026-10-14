import * as text from "../../../../kit/text.js";

/** Where a rolling branch group is in its life cycle. */
export type RollingBranchGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling branch group as the branch team keeps it. */
export class RollingBranchGroup {
  code: string;
  title: string;
  description: string;
  startsAt: number;
  summary: string;
  cohort: string;
  status: RollingBranchGroupStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    startsAt: number,
    summary: string,
    cohort: string,
    status: RollingBranchGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.startsAt = startsAt;
    this.summary = summary;
    this.cohort = cohort;
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

  canMoveTo(next: RollingBranchGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingBranchGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling branch group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): RollingBranchGroup {
    return new RollingBranchGroup(
      this.code,
      this.title,
      this.description,
      this.startsAt,
      this.summary,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling branch group in status planned. */
export function newRollingBranchGroup(code: string, title: string): RollingBranchGroup {
  return new RollingBranchGroup(code, title, "", 0, "", "", "planned");
}
