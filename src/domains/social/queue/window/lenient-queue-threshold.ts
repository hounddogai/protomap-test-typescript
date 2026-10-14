import * as text from "../../../../kit/text.js";

/** Where a lenient queue threshold is in its life cycle. */
export type LenientQueueThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One lenient queue threshold, with what the planners need to act on it. */
export class LenientQueueThreshold {
  code: string;
  title: string;
  locale: string;
  cost: number;
  journeyId: string;
  margin: number;
  createdAt: number;
  clicks: number;
  status: LenientQueueThresholdStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    cost: number,
    journeyId: string,
    margin: number,
    createdAt: number,
    clicks: number,
    status: LenientQueueThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.cost = cost;
    this.journeyId = journeyId;
    this.margin = margin;
    this.createdAt = createdAt;
    this.clicks = clicks;
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

  canMoveTo(next: LenientQueueThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientQueueThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient queue threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveValue(): number {
    return Math.round((this.clicks - this.margin) * 100) / 100;
  }

  copy(): LenientQueueThreshold {
    return new LenientQueueThreshold(
      this.code,
      this.title,
      this.locale,
      this.cost,
      this.journeyId,
      this.margin,
      this.createdAt,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient queue threshold in status planned. */
export function newLenientQueueThreshold(code: string, title: string): LenientQueueThreshold {
  return new LenientQueueThreshold(code, title, "", 0, "", 0, 0, 0, "planned");
}
