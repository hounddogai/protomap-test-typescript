import * as text from "../../../../kit/text.js";

/** Where a invite milestone is in its life cycle. */
export type InviteMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A invite milestone. Its code is unique within a tenant. */
export class InviteMilestone {
  code: string;
  title: string;
  utmSource: string;
  approved: boolean;
  description: string;
  name: string;
  updatedAt: number;
  cohort: string;
  status: InviteMilestoneStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    approved: boolean,
    description: string,
    name: string,
    updatedAt: number,
    cohort: string,
    status: InviteMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.approved = approved;
    this.description = description;
    this.name = name;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: InviteMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: InviteMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"invite milestone"} ${this.code}`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): InviteMilestone {
    return new InviteMilestone(
      this.code,
      this.title,
      this.utmSource,
      this.approved,
      this.description,
      this.name,
      this.updatedAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a invite milestone in status planned. */
export function newInviteMilestone(code: string, title: string): InviteMilestone {
  return new InviteMilestone(code, title, "", false, "", "", 0, "", "planned");
}
