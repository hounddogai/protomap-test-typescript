import * as text from "../../../../kit/text.js";

/** Where a branch budget is in its life cycle. */
export type BranchBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One branch budget, with what the planners need to act on it. */
export class BranchBudget {
  code: string;
  label: string;
  campaignRef: string;
  reviewer: string;
  variant: string;
  externalRef: string;
  limit: number;
  clicks: number;
  tags: string[];
  createdAt: number;
  unit: string;
  status: BranchBudgetStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    reviewer: string,
    variant: string,
    externalRef: string,
    limit: number,
    clicks: number,
    tags: string[],
    createdAt: number,
    unit: string,
    status: BranchBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.variant = variant;
    this.externalRef = externalRef;
    this.limit = limit;
    this.clicks = clicks;
    this.tags = tags;
    this.createdAt = createdAt;
    this.unit = unit;
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

  canMoveTo(next: BranchBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BranchBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedLoad(): number {
    return Math.round((this.limit + this.clicks) * 100) / 100;
  }

  copy(): BranchBudget {
    return new BranchBudget(
      this.code,
      this.label,
      this.campaignRef,
      this.reviewer,
      this.variant,
      this.externalRef,
      this.limit,
      this.clicks,
      this.tags,
      this.createdAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a branch budget in status planned. */
export function newBranchBudget(code: string, label: string): BranchBudget {
  return new BranchBudget(code, label, "", "", "", "", 0, 0, [], 0, "", "planned");
}
