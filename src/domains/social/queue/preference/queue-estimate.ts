import * as text from "../../../../kit/text.js";

/** Where a queue estimate is in its life cycle. */
export type QueueEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One queue estimate, with what the planners need to act on it. */
export class QueueEstimate {
  code: string;
  title: string;
  clicks: number;
  ownerId: string;
  description: string;
  source: string;
  channel: string;
  cohort: string;
  expiresAt: number;
  status: QueueEstimateStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    ownerId: string,
    description: string,
    source: string,
    channel: string,
    cohort: string,
    expiresAt: number,
    status: QueueEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.ownerId = ownerId;
    this.description = description;
    this.source = source;
    this.channel = channel;
    this.cohort = cohort;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: QueueEstimateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "archived";
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

  moveTo(next: QueueEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"queue estimate"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.clicks * this.expiresAt * 100) / 100;
  }

  copy(): QueueEstimate {
    return new QueueEstimate(
      this.code,
      this.title,
      this.clicks,
      this.ownerId,
      this.description,
      this.source,
      this.channel,
      this.cohort,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a queue estimate in status open. */
export function newQueueEstimate(code: string, title: string): QueueEstimate {
  return new QueueEstimate(code, title, 0, "", "", "", "", "", 0, "open");
}
