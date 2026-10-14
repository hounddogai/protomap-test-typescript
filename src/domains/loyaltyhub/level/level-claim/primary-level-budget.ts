import * as text from "../../../../kit/text.js";

/** Where a primary level budget is in its life cycle. */
export type PrimaryLevelBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary level budget as the level team keeps it. */
export class PrimaryLevelBudget {
  code: string;
  label: string;
  revision: number;
  budget: number;
  margin: number;
  sequence: number;
  status: PrimaryLevelBudgetStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    budget: number,
    margin: number,
    sequence: number,
    status: PrimaryLevelBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.budget = budget;
    this.margin = margin;
    this.sequence = sequence;
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

  canMoveTo(next: PrimaryLevelBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
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

  moveTo(next: PrimaryLevelBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary level budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"primary level budget"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.sequence - this.budget) * 100) / 100;
  }

  copy(): PrimaryLevelBudget {
    return new PrimaryLevelBudget(
      this.code,
      this.label,
      this.revision,
      this.budget,
      this.margin,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary level budget in status idle. */
export function newPrimaryLevelBudget(code: string, label: string): PrimaryLevelBudget {
  return new PrimaryLevelBudget(code, label, 0, 0, 0, 0, "idle");
}
