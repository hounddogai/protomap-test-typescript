import * as text from "../../../../kit/text.js";

/** Where a branch assignment is in its life cycle. */
export type BranchAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A branch assignment. Its code is unique within a tenant. */
export class BranchAssignment {
  code: string;
  title: string;
  archived: boolean;
  channel: string;
  amount: number;
  campaignRef: string;
  clicks: number;
  phone: string;
  locale: string;
  journeyId: string;
  status: BranchAssignmentStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    channel: string,
    amount: number,
    campaignRef: string,
    clicks: number,
    phone: string,
    locale: string,
    journeyId: string,
    status: BranchAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.channel = channel;
    this.amount = amount;
    this.campaignRef = campaignRef;
    this.clicks = clicks;
    this.phone = phone;
    this.locale = locale;
    this.journeyId = journeyId;
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

  canMoveTo(next: BranchAssignmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BranchAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round((this.amount - this.clicks) * 100) / 100;
  }

  copy(): BranchAssignment {
    return new BranchAssignment(
      this.code,
      this.title,
      this.archived,
      this.channel,
      this.amount,
      this.campaignRef,
      this.clicks,
      this.phone,
      this.locale,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a branch assignment in status planned. */
export function newBranchAssignment(code: string, title: string): BranchAssignment {
  return new BranchAssignment(code, title, false, "", 0, "", 0, "", "", "", "planned");
}
