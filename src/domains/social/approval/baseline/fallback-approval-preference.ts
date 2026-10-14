import * as text from "../../../../kit/text.js";

/** Where a fallback approval preference is in its life cycle. */
export type FallbackApprovalPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a fallback approval preference and its current status. */
export class FallbackApprovalPreference {
  code: string;
  label: string;
  expiresAt: number;
  priority: number;
  campaignRef: string;
  segment: string;
  approved: boolean;
  unit: string;
  discount: number;
  status: FallbackApprovalPreferenceStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    priority: number,
    campaignRef: string,
    segment: string,
    approved: boolean,
    unit: string,
    discount: number,
    status: FallbackApprovalPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.approved = approved;
    this.unit = unit;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackApprovalPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackApprovalPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback approval preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round(this.expiresAt * this.discount * 100) / 100;
  }

  copy(): FallbackApprovalPreference {
    return new FallbackApprovalPreference(
      this.code,
      this.label,
      this.expiresAt,
      this.priority,
      this.campaignRef,
      this.segment,
      this.approved,
      this.unit,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback approval preference in status new. */
export function newFallbackApprovalPreference(code: string, label: string): FallbackApprovalPreference {
  return new FallbackApprovalPreference(code, label, 0, 0, "", "", false, "", 0, "new");
}
