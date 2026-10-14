import * as text from "../../../../kit/text.js";

/** Where a global escalation summary is in its life cycle. */
export type GlobalEscalationSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global escalation summary. Its code is unique within a tenant. */
export class GlobalEscalationSummary {
  code: string;
  name: string;
  cost: number;
  budget: number;
  region: string;
  revision: number;
  impressions: number;
  currency: string;
  ratio: number;
  attempts: number;
  status: GlobalEscalationSummaryStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    budget: number,
    region: string,
    revision: number,
    impressions: number,
    currency: string,
    ratio: number,
    attempts: number,
    status: GlobalEscalationSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.budget = budget;
    this.region = region;
    this.revision = revision;
    this.impressions = impressions;
    this.currency = currency;
    this.ratio = ratio;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalEscalationSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalEscalationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global escalation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"global escalation summary"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.revision + this.attempts) * 100) / 100;
  }

  copy(): GlobalEscalationSummary {
    return new GlobalEscalationSummary(
      this.code,
      this.name,
      this.cost,
      this.budget,
      this.region,
      this.revision,
      this.impressions,
      this.currency,
      this.ratio,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global escalation summary in status planned. */
export function newGlobalEscalationSummary(code: string, name: string): GlobalEscalationSummary {
  return new GlobalEscalationSummary(code, name, 0, 0, "", 0, 0, "", 0, 0, "planned");
}
