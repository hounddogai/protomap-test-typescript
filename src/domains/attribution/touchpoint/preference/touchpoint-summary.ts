import * as text from "../../../../kit/text.js";

/** Where a touchpoint summary is in its life cycle. */
export type TouchpointSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One touchpoint summary, with what the planners need to act on it. */
export class TouchpointSummary {
  code: string;
  label: string;
  currency: string;
  impressions: number;
  approved: boolean;
  cost: number;
  score: number;
  sendAt: number;
  status: TouchpointSummaryStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    impressions: number,
    approved: boolean,
    cost: number,
    score: number,
    sendAt: number,
    status: TouchpointSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.impressions = impressions;
    this.approved = approved;
    this.cost = cost;
    this.score = score;
    this.sendAt = sendAt;
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

  canMoveTo(next: TouchpointSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round(this.impressions * this.sendAt * 100) / 100;
  }

  copy(): TouchpointSummary {
    return new TouchpointSummary(
      this.code,
      this.label,
      this.currency,
      this.impressions,
      this.approved,
      this.cost,
      this.score,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a touchpoint summary in status open. */
export function newTouchpointSummary(code: string, label: string): TouchpointSummary {
  return new TouchpointSummary(code, label, "", 0, false, 0, 0, 0, "open");
}
