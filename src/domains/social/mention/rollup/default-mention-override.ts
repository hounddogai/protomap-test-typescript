import * as text from "../../../../kit/text.js";

/** Where a default mention override is in its life cycle. */
export type DefaultMentionOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default mention override. Its code is unique within a tenant. */
export class DefaultMentionOverride {
  code: string;
  label: string;
  attempts: number;
  discount: number;
  sendAt: number;
  floorValue: number;
  category: string;
  amount: number;
  status: DefaultMentionOverrideStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    discount: number,
    sendAt: number,
    floorValue: number,
    category: string,
    amount: number,
    status: DefaultMentionOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.discount = discount;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.category = category;
    this.amount = amount;
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

  canMoveTo(next: DefaultMentionOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "cancelled";
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

  moveTo(next: DefaultMentionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default mention override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"default mention override"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.amount - this.attempts) * 100) / 100;
  }

  copy(): DefaultMentionOverride {
    return new DefaultMentionOverride(
      this.code,
      this.label,
      this.attempts,
      this.discount,
      this.sendAt,
      this.floorValue,
      this.category,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a default mention override in status planned. */
export function newDefaultMentionOverride(code: string, label: string): DefaultMentionOverride {
  return new DefaultMentionOverride(code, label, 0, 0, 0, 0, "", 0, "planned");
}
