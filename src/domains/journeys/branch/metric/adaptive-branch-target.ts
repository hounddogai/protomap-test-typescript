import * as text from "../../../../kit/text.js";

/** Where a adaptive branch target is in its life cycle. */
export type AdaptiveBranchTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One adaptive branch target, with what the planners need to act on it. */
export class AdaptiveBranchTarget {
  code: string;
  name: string;
  openRate: number;
  cost: number;
  margin: number;
  unit: string;
  revision: number;
  active: boolean;
  ceiling: number;
  status: AdaptiveBranchTargetStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    cost: number,
    margin: number,
    unit: string,
    revision: number,
    active: boolean,
    ceiling: number,
    status: AdaptiveBranchTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.cost = cost;
    this.margin = margin;
    this.unit = unit;
    this.revision = revision;
    this.active = active;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveBranchTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveBranchTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive branch target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.revision * this.openRate * 100) / 100;
  }

  copy(): AdaptiveBranchTarget {
    return new AdaptiveBranchTarget(
      this.code,
      this.name,
      this.openRate,
      this.cost,
      this.margin,
      this.unit,
      this.revision,
      this.active,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive branch target in status idle. */
export function newAdaptiveBranchTarget(code: string, name: string): AdaptiveBranchTarget {
  return new AdaptiveBranchTarget(code, name, 0, 0, 0, "", 0, false, 0, "idle");
}
