import * as text from "../../../../kit/text.js";

/** Where a opt out policy is in its life cycle. */
export type OptOutPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A opt out policy. Its code is unique within a tenant. */
export class OptOutPolicy {
  code: string;
  name: string;
  priority: number;
  campaignRef: string;
  discount: number;
  impressions: number;
  category: string;
  expiresAt: number;
  weight: number;
  unit: string;
  status: OptOutPolicyStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    campaignRef: string,
    discount: number,
    impressions: number,
    category: string,
    expiresAt: number,
    weight: number,
    unit: string,
    status: OptOutPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.discount = discount;
    this.impressions = impressions;
    this.category = category;
    this.expiresAt = expiresAt;
    this.weight = weight;
    this.unit = unit;
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

  canMoveTo(next: OptOutPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: OptOutPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"opt out policy"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.impressions + this.weight) * 100) / 100;
  }

  copy(): OptOutPolicy {
    return new OptOutPolicy(
      this.code,
      this.name,
      this.priority,
      this.campaignRef,
      this.discount,
      this.impressions,
      this.category,
      this.expiresAt,
      this.weight,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a opt out policy in status planned. */
export function newOptOutPolicy(code: string, name: string): OptOutPolicy {
  return new OptOutPolicy(code, name, 0, "", 0, 0, "", 0, 0, "", "planned");
}
