/**
 * The lenient proof audit records of consentcenter's proof work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient proof audit is in its life cycle. */
export type LenientProofAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient proof audit and its current status. */
export class LenientProofAudit {
  code: string;
  title: string;
  weight: number;
  openRate: number;
  campaignRef: string;
  label: string;
  amount: number;
  status: LenientProofAuditStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    openRate: number,
    campaignRef: string,
    label: string,
    amount: number,
    status: LenientProofAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.label = label;
    this.amount = amount;
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

  canMoveTo(next: LenientProofAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientProofAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient proof audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.openRate + this.weight) * 100) / 100;
  }

  copy(): LenientProofAudit {
    return new LenientProofAudit(
      this.code,
      this.title,
      this.weight,
      this.openRate,
      this.campaignRef,
      this.label,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient proof audit in status idle. */
export function newLenientProofAudit(code: string, title: string): LenientProofAudit {
  return new LenientProofAudit(code, title, 0, 0, "", "", 0, "idle");
}
