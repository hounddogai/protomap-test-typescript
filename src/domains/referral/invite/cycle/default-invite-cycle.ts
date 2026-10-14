/**
 * The default invite cycle records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default invite cycle is in its life cycle. */
export type DefaultInviteCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default invite cycle as the invite team keeps it. */
export class DefaultInviteCycle {
  code: string;
  label: string;
  threshold: number;
  summary: string;
  journeyId: string;
  utmSource: string;
  amount: number;
  weight: number;
  status: DefaultInviteCycleStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    summary: string,
    journeyId: string,
    utmSource: string,
    amount: number,
    weight: number,
    status: DefaultInviteCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.summary = summary;
    this.journeyId = journeyId;
    this.utmSource = utmSource;
    this.amount = amount;
    this.weight = weight;
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

  canMoveTo(next: DefaultInviteCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "withdrawn":
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

  moveTo(next: DefaultInviteCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default invite cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"default invite cycle"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.amount + this.weight) * 100) / 100;
  }

  copy(): DefaultInviteCycle {
    return new DefaultInviteCycle(
      this.code,
      this.label,
      this.threshold,
      this.summary,
      this.journeyId,
      this.utmSource,
      this.amount,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a default invite cycle in status proposed. */
export function newDefaultInviteCycle(code: string, label: string): DefaultInviteCycle {
  return new DefaultInviteCycle(code, label, 0, "", "", "", 0, 0, "proposed");
}
