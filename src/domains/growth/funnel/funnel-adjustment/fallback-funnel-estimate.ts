import * as text from "../../../../kit/text.js";

/** Where a fallback funnel estimate is in its life cycle. */
export type FallbackFunnelEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fallback funnel estimate and its current status. */
export class FallbackFunnelEstimate {
  code: string;
  label: string;
  retries: number;
  expiresAt: number;
  currency: string;
  updatedAt: number;
  audienceId: string;
  variant: string;
  status: FallbackFunnelEstimateStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    expiresAt: number,
    currency: string,
    updatedAt: number,
    audienceId: string,
    variant: string,
    status: FallbackFunnelEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.updatedAt = updatedAt;
    this.audienceId = audienceId;
    this.variant = variant;
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

  canMoveTo(next: FallbackFunnelEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackFunnelEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback funnel estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netLoad(): number {
    return Math.round(this.expiresAt * this.updatedAt * 100) / 100;
  }

  copy(): FallbackFunnelEstimate {
    return new FallbackFunnelEstimate(
      this.code,
      this.label,
      this.retries,
      this.expiresAt,
      this.currency,
      this.updatedAt,
      this.audienceId,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback funnel estimate in status idle. */
export function newFallbackFunnelEstimate(code: string, label: string): FallbackFunnelEstimate {
  return new FallbackFunnelEstimate(code, label, 0, 0, "", 0, "", "", "idle");
}
