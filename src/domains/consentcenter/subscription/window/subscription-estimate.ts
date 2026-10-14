import * as text from "../../../../kit/text.js";

/** Where a subscription estimate is in its life cycle. */
export type SubscriptionEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A subscription estimate. Its code is unique within a tenant. */
export class SubscriptionEstimate {
  code: string;
  name: string;
  audienceId: string;
  ratio: number;
  summary: string;
  startsAt: number;
  priority: number;
  locale: string;
  notes: string;
  amount: number;
  clicks: number;
  status: SubscriptionEstimateStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    ratio: number,
    summary: string,
    startsAt: number,
    priority: number,
    locale: string,
    notes: string,
    amount: number,
    clicks: number,
    status: SubscriptionEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.summary = summary;
    this.startsAt = startsAt;
    this.priority = priority;
    this.locale = locale;
    this.notes = notes;
    this.amount = amount;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedExposure(): number {
    return Math.round((this.priority - this.startsAt) * 100) / 100;
  }

  copy(): SubscriptionEstimate {
    return new SubscriptionEstimate(
      this.code,
      this.name,
      this.audienceId,
      this.ratio,
      this.summary,
      this.startsAt,
      this.priority,
      this.locale,
      this.notes,
      this.amount,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a subscription estimate in status draft. */
export function newSubscriptionEstimate(code: string, name: string): SubscriptionEstimate {
  return new SubscriptionEstimate(code, name, "", 0, "", 0, 0, "", "", 0, 0, "draft");
}
