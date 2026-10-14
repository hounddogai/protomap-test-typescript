import * as text from "../../../../kit/text.js";

/** Where a badge rule is in its life cycle. */
export type BadgeRuleStatus = "created" | "validated" | "published" | "retired";

/** A badge rule as the badge team keeps it. */
export class BadgeRule {
  code: string;
  label: string;
  visible: boolean;
  durationMinutes: number;
  clicks: number;
  retries: number;
  capacity: number;
  budget: number;
  status: BadgeRuleStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    durationMinutes: number,
    clicks: number,
    retries: number,
    capacity: number,
    budget: number,
    status: BadgeRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.durationMinutes = durationMinutes;
    this.clicks = clicks;
    this.retries = retries;
    this.capacity = capacity;
    this.budget = budget;
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

  canMoveTo(next: BadgeRuleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
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

  moveTo(next: BadgeRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round(this.capacity * this.clicks * 100) / 100;
  }

  copy(): BadgeRule {
    return new BadgeRule(
      this.code,
      this.label,
      this.visible,
      this.durationMinutes,
      this.clicks,
      this.retries,
      this.capacity,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a badge rule in status created. */
export function newBadgeRule(code: string, label: string): BadgeRule {
  return new BadgeRule(code, label, false, 0, 0, 0, 0, 0, "created");
}
