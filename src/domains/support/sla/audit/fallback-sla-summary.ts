import * as text from "../../../../kit/text.js";

/** Where a fallback sla summary is in its life cycle. */
export type FallbackSlaSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a fallback sla summary and its current status. */
export class FallbackSlaSummary {
  code: string;
  title: string;
  channel: string;
  batchSize: number;
  durationMinutes: number;
  pinned: boolean;
  status: FallbackSlaSummaryStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    batchSize: number,
    durationMinutes: number,
    pinned: boolean,
    status: FallbackSlaSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.batchSize = batchSize;
    this.durationMinutes = durationMinutes;
    this.pinned = pinned;
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

  canMoveTo(next: FallbackSlaSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackSlaSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sla summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback sla summary"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.durationMinutes + this.batchSize) * 100) / 100;
  }

  copy(): FallbackSlaSummary {
    return new FallbackSlaSummary(
      this.code,
      this.title,
      this.channel,
      this.batchSize,
      this.durationMinutes,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback sla summary in status open. */
export function newFallbackSlaSummary(code: string, title: string): FallbackSlaSummary {
  return new FallbackSlaSummary(code, title, "", 0, 0, false, "open");
}
