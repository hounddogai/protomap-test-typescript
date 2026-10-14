import * as text from "../../../../kit/text.js";

/** Where a bounce estimate is in its life cycle. */
export type BounceEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One bounce estimate, with what the planners need to act on it. */
export class BounceEstimate {
  code: string;
  title: string;
  archived: boolean;
  journeyId: string;
  attempts: number;
  sendAt: number;
  utmSource: string;
  visible: boolean;
  status: BounceEstimateStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    journeyId: string,
    attempts: number,
    sendAt: number,
    utmSource: string,
    visible: boolean,
    status: BounceEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.journeyId = journeyId;
    this.attempts = attempts;
    this.sendAt = sendAt;
    this.utmSource = utmSource;
    this.visible = visible;
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

  canMoveTo(next: BounceEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BounceEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.attempts - this.sendAt) * 100) / 100;
  }

  copy(): BounceEstimate {
    return new BounceEstimate(
      this.code,
      this.title,
      this.archived,
      this.journeyId,
      this.attempts,
      this.sendAt,
      this.utmSource,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a bounce estimate in status proposed. */
export function newBounceEstimate(code: string, title: string): BounceEstimate {
  return new BounceEstimate(code, title, false, "", 0, 0, "", false, "proposed");
}
