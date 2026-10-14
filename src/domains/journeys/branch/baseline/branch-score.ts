import * as text from "../../../../kit/text.js";

/** Where a branch score is in its life cycle. */
export type BranchScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A branch score. Its code is unique within a tenant. */
export class BranchScore {
  code: string;
  title: string;
  channel: string;
  impressions: number;
  journeyId: string;
  locale: string;
  status: BranchScoreStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    impressions: number,
    journeyId: string,
    locale: string,
    status: BranchScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.locale = locale;
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

  canMoveTo(next: BranchScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BranchScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"branch score"} ${this.code}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): BranchScore {
    return new BranchScore(
      this.code,
      this.title,
      this.channel,
      this.impressions,
      this.journeyId,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a branch score in status proposed. */
export function newBranchScore(code: string, title: string): BranchScore {
  return new BranchScore(code, title, "", 0, "", "", "proposed");
}
