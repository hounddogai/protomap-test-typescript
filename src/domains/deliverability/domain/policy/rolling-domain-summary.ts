import * as text from "../../../../kit/text.js";

/** Where a rolling domain summary is in its life cycle. */
export type RollingDomainSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One rolling domain summary, with what the planners need to act on it. */
export class RollingDomainSummary {
  code: string;
  title: string;
  updatedAt: number;
  label: string;
  startsAt: number;
  expiresAt: number;
  campaignRef: string;
  ratio: number;
  budget: number;
  active: boolean;
  currency: string;
  status: RollingDomainSummaryStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    label: string,
    startsAt: number,
    expiresAt: number,
    campaignRef: string,
    ratio: number,
    budget: number,
    active: boolean,
    currency: string,
    status: RollingDomainSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.label = label;
    this.startsAt = startsAt;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.budget = budget;
    this.active = active;
    this.currency = currency;
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

  canMoveTo(next: RollingDomainSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingDomainSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling domain summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round(this.updatedAt * this.expiresAt * 100) / 100;
  }

  copy(): RollingDomainSummary {
    return new RollingDomainSummary(
      this.code,
      this.title,
      this.updatedAt,
      this.label,
      this.startsAt,
      this.expiresAt,
      this.campaignRef,
      this.ratio,
      this.budget,
      this.active,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling domain summary in status proposed. */
export function newRollingDomainSummary(code: string, title: string): RollingDomainSummary {
  return new RollingDomainSummary(code, title, 0, "", 0, 0, "", 0, 0, false, "", "proposed");
}
