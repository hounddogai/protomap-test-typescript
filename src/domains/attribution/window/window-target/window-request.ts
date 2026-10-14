import * as text from "../../../../kit/text.js";

/** Where a window request is in its life cycle. */
export type WindowRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One window request, with what the planners need to act on it. */
export class WindowRequest {
  code: string;
  title: string;
  attempts: number;
  budget: number;
  audienceId: string;
  graceDays: number;
  impressions: number;
  campaignRef: string;
  reviewer: string;
  batchSize: number;
  ratio: number;
  status: WindowRequestStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    budget: number,
    audienceId: string,
    graceDays: number,
    impressions: number,
    campaignRef: string,
    reviewer: string,
    batchSize: number,
    ratio: number,
    status: WindowRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.budget = budget;
    this.audienceId = audienceId;
    this.graceDays = graceDays;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.batchSize = batchSize;
    this.ratio = ratio;
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

  canMoveTo(next: WindowRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedTotal(): number {
    return Math.round((this.ratio + this.graceDays) * 100) / 100;
  }

  copy(): WindowRequest {
    return new WindowRequest(
      this.code,
      this.title,
      this.attempts,
      this.budget,
      this.audienceId,
      this.graceDays,
      this.impressions,
      this.campaignRef,
      this.reviewer,
      this.batchSize,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a window request in status proposed. */
export function newWindowRequest(code: string, title: string): WindowRequest {
  return new WindowRequest(code, title, 0, 0, "", 0, 0, "", "", 0, 0, "proposed");
}
