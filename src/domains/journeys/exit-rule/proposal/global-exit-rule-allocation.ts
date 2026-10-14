import * as text from "../../../../kit/text.js";

/** Where a global exit rule allocation is in its life cycle. */
export type GlobalExitRuleAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A global exit rule allocation as the exit rule team keeps it. */
export class GlobalExitRuleAllocation {
  code: string;
  label: string;
  revision: number;
  notes: string;
  priority: number;
  approved: boolean;
  ownerId: string;
  impressions: number;
  updatedAt: number;
  variant: string;
  description: string;
  status: GlobalExitRuleAllocationStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    notes: string,
    priority: number,
    approved: boolean,
    ownerId: string,
    impressions: number,
    updatedAt: number,
    variant: string,
    description: string,
    status: GlobalExitRuleAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.notes = notes;
    this.priority = priority;
    this.approved = approved;
    this.ownerId = ownerId;
    this.impressions = impressions;
    this.updatedAt = updatedAt;
    this.variant = variant;
    this.description = description;
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

  canMoveTo(next: GlobalExitRuleAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalExitRuleAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global exit rule allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netLoad(): number {
    return Math.round(this.impressions * this.priority * 100) / 100;
  }

  copy(): GlobalExitRuleAllocation {
    return new GlobalExitRuleAllocation(
      this.code,
      this.label,
      this.revision,
      this.notes,
      this.priority,
      this.approved,
      this.ownerId,
      this.impressions,
      this.updatedAt,
      this.variant,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global exit rule allocation in status open. */
export function newGlobalExitRuleAllocation(code: string, label: string): GlobalExitRuleAllocation {
  return new GlobalExitRuleAllocation(code, label, 0, "", 0, false, "", 0, 0, "", "", "open");
}
