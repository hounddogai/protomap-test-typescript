import * as text from "../../../../kit/text.js";

/** Where a tiered pacing audit is in its life cycle. */
export type TieredPacingAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One tiered pacing audit, with what the planners need to act on it. */
export class TieredPacingAudit {
  code: string;
  title: string;
  cohort: string;
  budget: number;
  updatedAt: number;
  approved: boolean;
  status: TieredPacingAuditStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    budget: number,
    updatedAt: number,
    approved: boolean,
    status: TieredPacingAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredPacingAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TieredPacingAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered pacing audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.updatedAt + this.budget) * 100) / 100;
  }

  copy(): TieredPacingAudit {
    return new TieredPacingAudit(
      this.code,
      this.title,
      this.cohort,
      this.budget,
      this.updatedAt,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered pacing audit in status proposed. */
export function newTieredPacingAudit(code: string, title: string): TieredPacingAudit {
  return new TieredPacingAudit(code, title, "", 0, 0, false, "proposed");
}
