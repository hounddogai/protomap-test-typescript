import * as text from "../../../../kit/text.js";

/** Where a weighted insight plan is in its life cycle. */
export type WeightedInsightPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted insight plan. Its code is unique within a tenant. */
export class WeightedInsightPlan {
  code: string;
  name: string;
  attempts: number;
  clicks: number;
  channel: string;
  limit: number;
  active: boolean;
  utmSource: string;
  status: WeightedInsightPlanStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    clicks: number,
    channel: string,
    limit: number,
    active: boolean,
    utmSource: string,
    status: WeightedInsightPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.clicks = clicks;
    this.channel = channel;
    this.limit = limit;
    this.active = active;
    this.utmSource = utmSource;
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

  canMoveTo(next: WeightedInsightPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedInsightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted insight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.clicks * this.limit * 100) / 100;
  }

  copy(): WeightedInsightPlan {
    return new WeightedInsightPlan(
      this.code,
      this.name,
      this.attempts,
      this.clicks,
      this.channel,
      this.limit,
      this.active,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted insight plan in status proposed. */
export function newWeightedInsightPlan(code: string, name: string): WeightedInsightPlan {
  return new WeightedInsightPlan(code, name, 0, 0, "", 0, false, "", "proposed");
}
