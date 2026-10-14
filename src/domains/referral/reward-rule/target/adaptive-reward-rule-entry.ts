import * as text from "../../../../kit/text.js";

/** Where a adaptive reward rule entry is in its life cycle. */
export type AdaptiveRewardRuleEntryStatus = "created" | "validated" | "published" | "retired";

/** A adaptive reward rule entry. Its code is unique within a tenant. */
export class AdaptiveRewardRuleEntry {
  code: string;
  label: string;
  floorValue: number;
  approved: boolean;
  active: boolean;
  attempts: number;
  priority: number;
  status: AdaptiveRewardRuleEntryStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    approved: boolean,
    active: boolean,
    attempts: number,
    priority: number,
    status: AdaptiveRewardRuleEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.approved = approved;
    this.active = active;
    this.attempts = attempts;
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

  canMoveTo(next: AdaptiveRewardRuleEntryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveRewardRuleEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reward rule entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.floorValue - this.priority) * 100) / 100;
  }

  copy(): AdaptiveRewardRuleEntry {
    return new AdaptiveRewardRuleEntry(
      this.code,
      this.label,
      this.floorValue,
      this.approved,
      this.active,
      this.attempts,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive reward rule entry in status created. */
export function newAdaptiveRewardRuleEntry(code: string, label: string): AdaptiveRewardRuleEntry {
  return new AdaptiveRewardRuleEntry(code, label, 0, false, false, 0, 0, "created");
}
