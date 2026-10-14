import * as text from "../../../../kit/text.js";

/** Where a insight override is in its life cycle. */
export type InsightOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One insight override, with what the planners need to act on it. */
export class InsightOverride {
  code: string;
  name: string;
  channel: string;
  threshold: number;
  cost: number;
  journeyId: string;
  reviewer: string;
  status: InsightOverrideStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    threshold: number,
    cost: number,
    journeyId: string,
    reviewer: string,
    status: InsightOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.threshold = threshold;
    this.cost = cost;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
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

  canMoveTo(next: InsightOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: InsightOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedValue(): number {
    return Math.round((this.cost + this.threshold) * 100) / 100;
  }

  copy(): InsightOverride {
    return new InsightOverride(
      this.code,
      this.name,
      this.channel,
      this.threshold,
      this.cost,
      this.journeyId,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a insight override in status planned. */
export function newInsightOverride(code: string, name: string): InsightOverride {
  return new InsightOverride(code, name, "", 0, 0, "", "", "planned");
}
