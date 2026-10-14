import * as text from "../../../../kit/text.js";

/** Where a lenient bid rule adjustment is in its life cycle. */
export type LenientBidRuleAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient bid rule adjustment and its current status. */
export class LenientBidRuleAdjustment {
  code: string;
  title: string;
  contactEmail: string;
  amount: number;
  expiresAt: number;
  status: LenientBidRuleAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    amount: number,
    expiresAt: number,
    status: LenientBidRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: LenientBidRuleAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientBidRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient bid rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"lenient bid rule adjustment"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.expiresAt * this.amount * 100) / 100;
  }

  copy(): LenientBidRuleAdjustment {
    return new LenientBidRuleAdjustment(
      this.code,
      this.title,
      this.contactEmail,
      this.amount,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient bid rule adjustment in status idle. */
export function newLenientBidRuleAdjustment(code: string, title: string): LenientBidRuleAdjustment {
  return new LenientBidRuleAdjustment(code, title, "", 0, 0, "idle");
}
