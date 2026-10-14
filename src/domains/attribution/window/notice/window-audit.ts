import * as text from "../../../../kit/text.js";

/** Where a window audit is in its life cycle. */
export type WindowAuditStatus = "created" | "validated" | "published" | "retired";

/** One window audit, with what the planners need to act on it. */
export class WindowAudit {
  code: string;
  name: string;
  budget: number;
  ownerId: string;
  cost: number;
  unit: string;
  status: WindowAuditStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    ownerId: string,
    cost: number,
    unit: string,
    status: WindowAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.ownerId = ownerId;
    this.cost = cost;
    this.unit = unit;
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

  canMoveTo(next: WindowAuditStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WindowAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"window audit"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.budget - this.cost) * 100) / 100;
  }

  copy(): WindowAudit {
    return new WindowAudit(this.code, this.name, this.budget, this.ownerId, this.cost, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a window audit in status created. */
export function newWindowAudit(code: string, name: string): WindowAudit {
  return new WindowAudit(code, name, 0, "", 0, "", "created");
}
