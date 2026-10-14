import * as text from "../../../../kit/text.js";

/** Where a legacy reward rule exception is in its life cycle. */
export type LegacyRewardRuleExceptionStatus = "created" | "validated" | "published" | "retired";

/** A legacy reward rule exception. Its code is unique within a tenant. */
export class LegacyRewardRuleException {
  code: string;
  name: string;
  notes: string;
  budget: number;
  active: boolean;
  margin: number;
  status: LegacyRewardRuleExceptionStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    budget: number,
    active: boolean,
    margin: number,
    status: LegacyRewardRuleExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.budget = budget;
    this.active = active;
    this.margin = margin;
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

  canMoveTo(next: LegacyRewardRuleExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyRewardRuleExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reward rule exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.margin - this.budget) * 100) / 100;
  }

  copy(): LegacyRewardRuleException {
    return new LegacyRewardRuleException(
      this.code,
      this.name,
      this.notes,
      this.budget,
      this.active,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy reward rule exception in status created. */
export function newLegacyRewardRuleException(code: string, name: string): LegacyRewardRuleException {
  return new LegacyRewardRuleException(code, name, "", 0, false, 0, "created");
}
