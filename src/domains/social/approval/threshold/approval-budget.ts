import * as text from "../../../../kit/text.js";

/** Where a approval budget is in its life cycle. */
export type ApprovalBudgetStatus = "created" | "validated" | "published" | "retired";

/** A approval budget. Its code is unique within a tenant. */
export class ApprovalBudget {
  code: string;
  label: string;
  source: string;
  expiresAt: number;
  priority: number;
  status: ApprovalBudgetStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    expiresAt: number,
    priority: number,
    status: ApprovalBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ApprovalBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ApprovalBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedExposure(): number {
    return Math.round((this.expiresAt - this.priority) * 100) / 100;
  }

  copy(): ApprovalBudget {
    return new ApprovalBudget(this.code, this.label, this.source, this.expiresAt, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a approval budget in status created. */
export function newApprovalBudget(code: string, label: string): ApprovalBudget {
  return new ApprovalBudget(code, label, "", 0, 0, "created");
}
