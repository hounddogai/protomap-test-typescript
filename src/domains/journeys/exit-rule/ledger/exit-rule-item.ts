import * as text from "../../../../kit/text.js";

/** Where a exit rule item is in its life cycle. */
export type ExitRuleItemStatus = "created" | "validated" | "published" | "retired";

/** A exit rule item. Its code is unique within a tenant. */
export class ExitRuleItem {
  code: string;
  label: string;
  cohort: string;
  createdAt: number;
  contactEmail: string;
  timezone: string;
  summary: string;
  cost: number;
  visible: boolean;
  status: ExitRuleItemStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    createdAt: number,
    contactEmail: string,
    timezone: string,
    summary: string,
    cost: number,
    visible: boolean,
    status: ExitRuleItemStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.timezone = timezone;
    this.summary = summary;
    this.cost = cost;
    this.visible = visible;
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

  canMoveTo(next: ExitRuleItemStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
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

  moveTo(next: ExitRuleItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"exit rule item"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.cost + this.createdAt) * 100) / 100;
  }

  copy(): ExitRuleItem {
    return new ExitRuleItem(
      this.code,
      this.label,
      this.cohort,
      this.createdAt,
      this.contactEmail,
      this.timezone,
      this.summary,
      this.cost,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a exit rule item in status created. */
export function newExitRuleItem(code: string, label: string): ExitRuleItem {
  return new ExitRuleItem(code, label, "", 0, "", "", "", 0, false, "created");
}
