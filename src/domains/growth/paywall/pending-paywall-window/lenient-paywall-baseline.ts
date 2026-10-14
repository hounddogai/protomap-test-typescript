import * as text from "../../../../kit/text.js";

/** Where a lenient paywall baseline is in its life cycle. */
export type LenientPaywallBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient paywall baseline. Its code is unique within a tenant. */
export class LenientPaywallBaseline {
  code: string;
  label: string;
  updatedAt: number;
  batchSize: number;
  priority: number;
  ownerId: string;
  ratio: number;
  status: LenientPaywallBaselineStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    batchSize: number,
    priority: number,
    ownerId: string,
    ratio: number,
    status: LenientPaywallBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.batchSize = batchSize;
    this.priority = priority;
    this.ownerId = ownerId;
    this.ratio = ratio;
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

  canMoveTo(next: LenientPaywallBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPaywallBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient paywall baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedExposure(): number {
    return Math.round((this.updatedAt - this.ratio) * 100) / 100;
  }

  copy(): LenientPaywallBaseline {
    return new LenientPaywallBaseline(
      this.code,
      this.label,
      this.updatedAt,
      this.batchSize,
      this.priority,
      this.ownerId,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient paywall baseline in status requested. */
export function newLenientPaywallBaseline(code: string, label: string): LenientPaywallBaseline {
  return new LenientPaywallBaseline(code, label, 0, 0, 0, "", 0, "requested");
}
