import * as text from "../../../../kit/text.js";

/** Where a strict reputation summary is in its life cycle. */
export type StrictReputationSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One strict reputation summary, with what the planners need to act on it. */
export class StrictReputationSummary {
  code: string;
  title: string;
  campaignRef: string;
  ratio: number;
  quantity: number;
  status: StrictReputationSummaryStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    ratio: number,
    quantity: number,
    status: StrictReputationSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.quantity = quantity;
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

  canMoveTo(next: StrictReputationSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
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
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictReputationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reputation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.quantity - this.ratio) * 100) / 100;
  }

  copy(): StrictReputationSummary {
    return new StrictReputationSummary(this.code, this.title, this.campaignRef, this.ratio, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict reputation summary in status proposed. */
export function newStrictReputationSummary(code: string, title: string): StrictReputationSummary {
  return new StrictReputationSummary(code, title, "", 0, 0, "proposed");
}
