import * as text from "../../../../kit/text.js";

/** Where a paywall adjustment is in its life cycle. */
export type PaywallAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A paywall adjustment. Its code is unique within a tenant. */
export class PaywallAdjustment {
  code: string;
  name: string;
  label: string;
  openRate: number;
  frequencyCap: number;
  notes: string;
  impressions: number;
  updatedAt: number;
  status: PaywallAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    openRate: number,
    frequencyCap: number,
    notes: string,
    impressions: number,
    updatedAt: number,
    status: PaywallAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.openRate = openRate;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.impressions = impressions;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PaywallAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round(this.impressions * this.frequencyCap * 100) / 100;
  }

  copy(): PaywallAdjustment {
    return new PaywallAdjustment(
      this.code,
      this.name,
      this.label,
      this.openRate,
      this.frequencyCap,
      this.notes,
      this.impressions,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a paywall adjustment in status open. */
export function newPaywallAdjustment(code: string, name: string): PaywallAdjustment {
  return new PaywallAdjustment(code, name, "", 0, 0, "", 0, 0, "open");
}
