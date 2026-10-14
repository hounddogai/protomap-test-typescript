/**
 * The pending insight agreement records of social's insight work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending insight agreement is in its life cycle. */
export type PendingInsightAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a pending insight agreement and its current status. */
export class PendingInsightAgreement {
  code: string;
  title: string;
  cost: number;
  graceDays: number;
  variant: string;
  archived: boolean;
  country: string;
  summary: string;
  status: PendingInsightAgreementStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    graceDays: number,
    variant: string,
    archived: boolean,
    country: string,
    summary: string,
    status: PendingInsightAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.graceDays = graceDays;
    this.variant = variant;
    this.archived = archived;
    this.country = country;
    this.summary = summary;
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

  canMoveTo(next: PendingInsightAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready";
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

  moveTo(next: PendingInsightAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending insight agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.graceDays - this.cost) * 100) / 100;
  }

  copy(): PendingInsightAgreement {
    return new PendingInsightAgreement(
      this.code,
      this.title,
      this.cost,
      this.graceDays,
      this.variant,
      this.archived,
      this.country,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending insight agreement in status idle. */
export function newPendingInsightAgreement(code: string, title: string): PendingInsightAgreement {
  return new PendingInsightAgreement(code, title, 0, 0, "", false, "", "", "idle");
}
