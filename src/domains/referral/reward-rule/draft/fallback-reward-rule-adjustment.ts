import * as text from "../../../../kit/text.js";

/** Where a fallback reward rule adjustment is in its life cycle. */
export type FallbackRewardRuleAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback reward rule adjustment as the reward rule team keeps it. */
export class FallbackRewardRuleAdjustment {
  code: string;
  name: string;
  quantity: number;
  createdAt: number;
  description: string;
  contactEmail: string;
  visible: boolean;
  notes: string;
  locale: string;
  limit: number;
  summary: string;
  status: FallbackRewardRuleAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    createdAt: number,
    description: string,
    contactEmail: string,
    visible: boolean,
    notes: string,
    locale: string,
    limit: number,
    summary: string,
    status: FallbackRewardRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.description = description;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.notes = notes;
    this.locale = locale;
    this.limit = limit;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackRewardRuleAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackRewardRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reward rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round((this.createdAt - this.limit) * 100) / 100;
  }

  copy(): FallbackRewardRuleAdjustment {
    return new FallbackRewardRuleAdjustment(
      this.code,
      this.name,
      this.quantity,
      this.createdAt,
      this.description,
      this.contactEmail,
      this.visible,
      this.notes,
      this.locale,
      this.limit,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback reward rule adjustment in status proposed. */
export function newFallbackRewardRuleAdjustment(code: string, name: string): FallbackRewardRuleAdjustment {
  return new FallbackRewardRuleAdjustment(code, name, 0, 0, "", "", false, "", "", 0, "", "proposed");
}
