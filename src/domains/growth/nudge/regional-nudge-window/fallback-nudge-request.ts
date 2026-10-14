import * as text from "../../../../kit/text.js";

/** Where a fallback nudge request is in its life cycle. */
export type FallbackNudgeRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a fallback nudge request and its current status. */
export class FallbackNudgeRequest {
  code: string;
  label: string;
  threshold: number;
  impressions: number;
  bid: number;
  reviewer: string;
  score: number;
  journeyId: string;
  channel: string;
  status: FallbackNudgeRequestStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    impressions: number,
    bid: number,
    reviewer: string,
    score: number,
    journeyId: string,
    channel: string,
    status: FallbackNudgeRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.impressions = impressions;
    this.bid = bid;
    this.reviewer = reviewer;
    this.score = score;
    this.journeyId = journeyId;
    this.channel = channel;
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

  canMoveTo(next: FallbackNudgeRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FallbackNudgeRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback nudge request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback nudge request"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.bid * this.impressions * 100) / 100;
  }

  copy(): FallbackNudgeRequest {
    return new FallbackNudgeRequest(
      this.code,
      this.label,
      this.threshold,
      this.impressions,
      this.bid,
      this.reviewer,
      this.score,
      this.journeyId,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback nudge request in status draft. */
export function newFallbackNudgeRequest(code: string, label: string): FallbackNudgeRequest {
  return new FallbackNudgeRequest(code, label, 0, 0, 0, "", 0, "", "", "draft");
}
