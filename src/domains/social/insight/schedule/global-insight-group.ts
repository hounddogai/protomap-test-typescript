import * as text from "../../../../kit/text.js";

/** Where a global insight group is in its life cycle. */
export type GlobalInsightGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** A global insight group. Its code is unique within a tenant. */
export class GlobalInsightGroup {
  code: string;
  label: string;
  threshold: number;
  attempts: number;
  margin: number;
  budget: number;
  graceDays: number;
  impressions: number;
  quantity: number;
  clicks: number;
  category: string;
  status: GlobalInsightGroupStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    attempts: number,
    margin: number,
    budget: number,
    graceDays: number,
    impressions: number,
    quantity: number,
    clicks: number,
    category: string,
    status: GlobalInsightGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.attempts = attempts;
    this.margin = margin;
    this.budget = budget;
    this.graceDays = graceDays;
    this.impressions = impressions;
    this.quantity = quantity;
    this.clicks = clicks;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalInsightGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalInsightGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global insight group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.impressions - this.margin) * 100) / 100;
  }

  copy(): GlobalInsightGroup {
    return new GlobalInsightGroup(
      this.code,
      this.label,
      this.threshold,
      this.attempts,
      this.margin,
      this.budget,
      this.graceDays,
      this.impressions,
      this.quantity,
      this.clicks,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global insight group in status requested. */
export function newGlobalInsightGroup(code: string, label: string): GlobalInsightGroup {
  return new GlobalInsightGroup(code, label, 0, 0, 0, 0, 0, 0, 0, 0, "", "requested");
}
