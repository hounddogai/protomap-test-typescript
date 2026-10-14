import * as text from "../../../../kit/text.js";

/** Where a primary funnel baseline is in its life cycle. */
export type PrimaryFunnelBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a primary funnel baseline and its current status. */
export class PrimaryFunnelBaseline {
  code: string;
  name: string;
  cohort: string;
  clicks: number;
  sequence: number;
  variant: string;
  currency: string;
  campaignRef: string;
  status: PrimaryFunnelBaselineStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    clicks: number,
    sequence: number,
    variant: string,
    currency: string,
    campaignRef: string,
    status: PrimaryFunnelBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.clicks = clicks;
    this.sequence = sequence;
    this.variant = variant;
    this.currency = currency;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: PrimaryFunnelBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PrimaryFunnelBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary funnel baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.sequence - this.clicks) * 100) / 100;
  }

  copy(): PrimaryFunnelBaseline {
    return new PrimaryFunnelBaseline(
      this.code,
      this.name,
      this.cohort,
      this.clicks,
      this.sequence,
      this.variant,
      this.currency,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary funnel baseline in status open. */
export function newPrimaryFunnelBaseline(code: string, name: string): PrimaryFunnelBaseline {
  return new PrimaryFunnelBaseline(code, name, "", 0, 0, "", "", "", "open");
}
