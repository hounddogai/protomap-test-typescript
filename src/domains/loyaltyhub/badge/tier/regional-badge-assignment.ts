import * as text from "../../../../kit/text.js";

/** Where a regional badge assignment is in its life cycle. */
export type RegionalBadgeAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One regional badge assignment, with what the planners need to act on it. */
export class RegionalBadgeAssignment {
  code: string;
  title: string;
  checksum: string;
  endsAt: number;
  approved: boolean;
  status: RegionalBadgeAssignmentStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    endsAt: number,
    approved: boolean,
    status: RegionalBadgeAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.endsAt = endsAt;
    this.approved = approved;
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

  canMoveTo(next: RegionalBadgeAssignmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalBadgeAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional badge assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional badge assignment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): RegionalBadgeAssignment {
    return new RegionalBadgeAssignment(this.code, this.title, this.checksum, this.endsAt, this.approved, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional badge assignment in status planned. */
export function newRegionalBadgeAssignment(code: string, title: string): RegionalBadgeAssignment {
  return new RegionalBadgeAssignment(code, title, "", 0, false, "planned");
}
