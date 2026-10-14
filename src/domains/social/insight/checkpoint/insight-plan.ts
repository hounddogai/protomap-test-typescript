import * as text from "../../../../kit/text.js";

/** Where a insight plan is in its life cycle. */
export type InsightPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** One insight plan, with what the planners need to act on it. */
export class InsightPlan {
  code: string;
  name: string;
  revision: number;
  source: string;
  weight: number;
  approved: boolean;
  startsAt: number;
  bid: number;
  status: InsightPlanStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    source: string,
    weight: number,
    approved: boolean,
    startsAt: number,
    bid: number,
    status: InsightPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.source = source;
    this.weight = weight;
    this.approved = approved;
    this.startsAt = startsAt;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: InsightPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: InsightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netValue(): number {
    return Math.round(this.weight * this.startsAt * 100) / 100;
  }

  copy(): InsightPlan {
    return new InsightPlan(
      this.code,
      this.name,
      this.revision,
      this.source,
      this.weight,
      this.approved,
      this.startsAt,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a insight plan in status requested. */
export function newInsightPlan(code: string, name: string): InsightPlan {
  return new InsightPlan(code, name, 0, "", 0, false, 0, 0, "requested");
}
