import * as text from "../../../../kit/text.js";

/** Where a adaptive bounce adjustment is in its life cycle. */
export type AdaptiveBounceAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a adaptive bounce adjustment and its current status. */
export class AdaptiveBounceAdjustment {
  code: string;
  label: string;
  openRate: number;
  attributes: Map<string, string>;
  endsAt: number;
  cohort: string;
  status: AdaptiveBounceAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    attributes: Map<string, string>,
    endsAt: number,
    cohort: string,
    status: AdaptiveBounceAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.attributes = attributes;
    this.endsAt = endsAt;
    this.cohort = cohort;
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

  canMoveTo(next: AdaptiveBounceAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
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

  moveTo(next: AdaptiveBounceAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive bounce adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round((this.endsAt - this.openRate) * 100) / 100;
  }

  copy(): AdaptiveBounceAdjustment {
    return new AdaptiveBounceAdjustment(
      this.code,
      this.label,
      this.openRate,
      this.attributes,
      this.endsAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive bounce adjustment in status requested. */
export function newAdaptiveBounceAdjustment(code: string, label: string): AdaptiveBounceAdjustment {
  return new AdaptiveBounceAdjustment(code, label, 0, new Map<string, string>(), 0, "", "requested");
}
