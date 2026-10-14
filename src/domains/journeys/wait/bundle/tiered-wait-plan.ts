import * as text from "../../../../kit/text.js";

/** Where a tiered wait plan is in its life cycle. */
export type TieredWaitPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a tiered wait plan and its current status. */
export class TieredWaitPlan {
  code: string;
  name: string;
  createdAt: number;
  discount: number;
  revision: number;
  expiresAt: number;
  approved: boolean;
  status: TieredWaitPlanStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    discount: number,
    revision: number,
    expiresAt: number,
    approved: boolean,
    status: TieredWaitPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.discount = discount;
    this.revision = revision;
    this.expiresAt = expiresAt;
    this.approved = approved;
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

  canMoveTo(next: TieredWaitPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
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
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TieredWaitPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered wait plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.createdAt - this.revision) * 100) / 100;
  }

  copy(): TieredWaitPlan {
    return new TieredWaitPlan(
      this.code,
      this.name,
      this.createdAt,
      this.discount,
      this.revision,
      this.expiresAt,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered wait plan in status open. */
export function newTieredWaitPlan(code: string, name: string): TieredWaitPlan {
  return new TieredWaitPlan(code, name, 0, 0, 0, 0, false, "open");
}
