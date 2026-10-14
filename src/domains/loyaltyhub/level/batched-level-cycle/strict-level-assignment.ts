import * as text from "../../../../kit/text.js";

/** Where a strict level assignment is in its life cycle. */
export type StrictLevelAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict level assignment as the level team keeps it. */
export class StrictLevelAssignment {
  code: string;
  title: string;
  active: boolean;
  capacity: number;
  contactEmail: string;
  approved: boolean;
  sendAt: number;
  status: StrictLevelAssignmentStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    capacity: number,
    contactEmail: string,
    approved: boolean,
    sendAt: number,
    status: StrictLevelAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.capacity = capacity;
    this.contactEmail = contactEmail;
    this.approved = approved;
    this.sendAt = sendAt;
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

  canMoveTo(next: StrictLevelAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictLevelAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict level assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"strict level assignment"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.capacity - this.sendAt) * 100) / 100;
  }

  copy(): StrictLevelAssignment {
    return new StrictLevelAssignment(
      this.code,
      this.title,
      this.active,
      this.capacity,
      this.contactEmail,
      this.approved,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict level assignment in status open. */
export function newStrictLevelAssignment(code: string, title: string): StrictLevelAssignment {
  return new StrictLevelAssignment(code, title, false, 0, "", false, 0, "open");
}
