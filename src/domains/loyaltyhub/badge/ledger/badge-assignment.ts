import * as text from "../../../../kit/text.js";

/** Where a badge assignment is in its life cycle. */
export type BadgeAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One badge assignment, with what the planners need to act on it. */
export class BadgeAssignment {
  code: string;
  name: string;
  summary: string;
  durationMinutes: number;
  startsAt: number;
  phone: string;
  expiresAt: number;
  createdAt: number;
  status: BadgeAssignmentStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    durationMinutes: number,
    startsAt: number,
    phone: string,
    expiresAt: number,
    createdAt: number,
    status: BadgeAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.durationMinutes = durationMinutes;
    this.startsAt = startsAt;
    this.phone = phone;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
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

  canMoveTo(next: BadgeAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: BadgeAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.durationMinutes + this.startsAt) * 100) / 100;
  }

  copy(): BadgeAssignment {
    return new BadgeAssignment(
      this.code,
      this.name,
      this.summary,
      this.durationMinutes,
      this.startsAt,
      this.phone,
      this.expiresAt,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a badge assignment in status open. */
export function newBadgeAssignment(code: string, name: string): BadgeAssignment {
  return new BadgeAssignment(code, name, "", 0, 0, "", 0, 0, "open");
}
