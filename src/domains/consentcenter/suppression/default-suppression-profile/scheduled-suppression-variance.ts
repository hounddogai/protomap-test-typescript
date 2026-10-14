import * as text from "../../../../kit/text.js";

/** Where a scheduled suppression variance is in its life cycle. */
export type ScheduledSuppressionVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled suppression variance. Its code is unique within a tenant. */
export class ScheduledSuppressionVariance {
  code: string;
  name: string;
  budget: number;
  variant: string;
  campaignRef: string;
  pinned: boolean;
  channel: string;
  journeyId: string;
  status: ScheduledSuppressionVarianceStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    variant: string,
    campaignRef: string,
    pinned: boolean,
    channel: string,
    journeyId: string,
    status: ScheduledSuppressionVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.variant = variant;
    this.campaignRef = campaignRef;
    this.pinned = pinned;
    this.channel = channel;
    this.journeyId = journeyId;
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

  canMoveTo(next: ScheduledSuppressionVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledSuppressionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled suppression variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): ScheduledSuppressionVariance {
    return new ScheduledSuppressionVariance(
      this.code,
      this.name,
      this.budget,
      this.variant,
      this.campaignRef,
      this.pinned,
      this.channel,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled suppression variance in status open. */
export function newScheduledSuppressionVariance(code: string, name: string): ScheduledSuppressionVariance {
  return new ScheduledSuppressionVariance(code, name, 0, "", "", false, "", "", "open");
}
