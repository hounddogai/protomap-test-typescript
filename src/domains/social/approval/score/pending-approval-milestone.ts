import * as text from "../../../../kit/text.js";

/** Where a pending approval milestone is in its life cycle. */
export type PendingApprovalMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pending approval milestone. Its code is unique within a tenant. */
export class PendingApprovalMilestone {
  code: string;
  title: string;
  durationMinutes: number;
  attributes: Map<string, string>;
  journeyId: string;
  updatedAt: number;
  utmSource: string;
  budget: number;
  status: PendingApprovalMilestoneStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    attributes: Map<string, string>,
    journeyId: string,
    updatedAt: number,
    utmSource: string,
    budget: number,
    status: PendingApprovalMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.attributes = attributes;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.budget = budget;
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

  canMoveTo(next: PendingApprovalMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingApprovalMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending approval milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.durationMinutes + this.updatedAt) * 100) / 100;
  }

  copy(): PendingApprovalMilestone {
    return new PendingApprovalMilestone(
      this.code,
      this.title,
      this.durationMinutes,
      this.attributes,
      this.journeyId,
      this.updatedAt,
      this.utmSource,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending approval milestone in status planned. */
export function newPendingApprovalMilestone(code: string, title: string): PendingApprovalMilestone {
  return new PendingApprovalMilestone(code, title, 0, new Map<string, string>(), "", 0, "", 0, "planned");
}
