import * as text from "../../../../kit/text.js";

/** Where a reward rule record is in its life cycle. */
export type RewardRuleRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reward rule record as the reward rule team keeps it. */
export class RewardRuleRecord {
  code: string;
  name: string;
  title: string;
  description: string;
  source: string;
  locale: string;
  unit: string;
  quantity: number;
  status: RewardRuleRecordStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    description: string,
    source: string,
    locale: string,
    unit: string,
    quantity: number,
    status: RewardRuleRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.description = description;
    this.source = source;
    this.locale = locale;
    this.unit = unit;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RewardRuleRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): RewardRuleRecord {
    return new RewardRuleRecord(
      this.code,
      this.name,
      this.title,
      this.description,
      this.source,
      this.locale,
      this.unit,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reward rule record in status planned. */
export function newRewardRuleRecord(code: string, name: string): RewardRuleRecord {
  return new RewardRuleRecord(code, name, "", "", "", "", "", 0, "planned");
}
