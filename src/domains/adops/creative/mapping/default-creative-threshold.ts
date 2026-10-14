import * as text from "../../../../kit/text.js";

/** Where a default creative threshold is in its life cycle. */
export type DefaultCreativeThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A default creative threshold. Its code is unique within a tenant. */
export class DefaultCreativeThreshold {
  code: string;
  label: string;
  currency: string;
  approved: boolean;
  openRate: number;
  externalRef: string;
  impressions: number;
  status: DefaultCreativeThresholdStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    approved: boolean,
    openRate: number,
    externalRef: string,
    impressions: number,
    status: DefaultCreativeThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.approved = approved;
    this.openRate = openRate;
    this.externalRef = externalRef;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultCreativeThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DefaultCreativeThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default creative threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round(this.impressions * this.openRate * 100) / 100;
  }

  copy(): DefaultCreativeThreshold {
    return new DefaultCreativeThreshold(
      this.code,
      this.label,
      this.currency,
      this.approved,
      this.openRate,
      this.externalRef,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default creative threshold in status idle. */
export function newDefaultCreativeThreshold(code: string, label: string): DefaultCreativeThreshold {
  return new DefaultCreativeThreshold(code, label, "", false, 0, "", 0, "idle");
}
