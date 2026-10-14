import * as text from "../../../../kit/text.js";

/** Where a tiered approval summary is in its life cycle. */
export type TieredApprovalSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered approval summary. Its code is unique within a tenant. */
export class TieredApprovalSummary {
  code: string;
  name: string;
  category: string;
  externalRef: string;
  channel: string;
  attempts: number;
  discount: number;
  threshold: number;
  windowDays: number;
  floorValue: number;
  reviewer: string;
  status: TieredApprovalSummaryStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    externalRef: string,
    channel: string,
    attempts: number,
    discount: number,
    threshold: number,
    windowDays: number,
    floorValue: number,
    reviewer: string,
    status: TieredApprovalSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.externalRef = externalRef;
    this.channel = channel;
    this.attempts = attempts;
    this.discount = discount;
    this.threshold = threshold;
    this.windowDays = windowDays;
    this.floorValue = floorValue;
    this.reviewer = reviewer;
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

  canMoveTo(next: TieredApprovalSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TieredApprovalSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered approval summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round((this.attempts + this.floorValue) * 100) / 100;
  }

  copy(): TieredApprovalSummary {
    return new TieredApprovalSummary(
      this.code,
      this.name,
      this.category,
      this.externalRef,
      this.channel,
      this.attempts,
      this.discount,
      this.threshold,
      this.windowDays,
      this.floorValue,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered approval summary in status open. */
export function newTieredApprovalSummary(code: string, name: string): TieredApprovalSummary {
  return new TieredApprovalSummary(code, name, "", "", "", 0, 0, 0, 0, 0, "", "open");
}
