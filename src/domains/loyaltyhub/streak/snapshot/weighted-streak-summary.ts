import * as text from "../../../../kit/text.js";

/** Where a weighted streak summary is in its life cycle. */
export type WeightedStreakSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a weighted streak summary and its current status. */
export class WeightedStreakSummary {
  code: string;
  title: string;
  description: string;
  ownerId: string;
  startsAt: number;
  pinned: boolean;
  priority: number;
  status: WeightedStreakSummaryStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    ownerId: string,
    startsAt: number,
    pinned: boolean,
    priority: number,
    status: WeightedStreakSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.ownerId = ownerId;
    this.startsAt = startsAt;
    this.pinned = pinned;
    this.priority = priority;
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

  canMoveTo(next: WeightedStreakSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedStreakSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted streak summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.startsAt + this.priority) * 100) / 100;
  }

  copy(): WeightedStreakSummary {
    return new WeightedStreakSummary(
      this.code,
      this.title,
      this.description,
      this.ownerId,
      this.startsAt,
      this.pinned,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted streak summary in status requested. */
export function newWeightedStreakSummary(code: string, title: string): WeightedStreakSummary {
  return new WeightedStreakSummary(code, title, "", "", 0, false, 0, "requested");
}
