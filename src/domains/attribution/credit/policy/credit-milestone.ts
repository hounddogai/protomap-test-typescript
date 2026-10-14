import * as text from "../../../../kit/text.js";

/** Where a credit milestone is in its life cycle. */
export type CreditMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** One credit milestone, with what the planners need to act on it. */
export class CreditMilestone {
  code: string;
  title: string;
  retries: number;
  visible: boolean;
  channel: string;
  audienceId: string;
  minimum: number;
  sequence: number;
  discount: number;
  impressions: number;
  windowDays: number;
  status: CreditMilestoneStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    visible: boolean,
    channel: string,
    audienceId: string,
    minimum: number,
    sequence: number,
    discount: number,
    impressions: number,
    windowDays: number,
    status: CreditMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.visible = visible;
    this.channel = channel;
    this.audienceId = audienceId;
    this.minimum = minimum;
    this.sequence = sequence;
    this.discount = discount;
    this.impressions = impressions;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"credit milestone"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.discount - this.minimum) * 100) / 100;
  }

  copy(): CreditMilestone {
    return new CreditMilestone(
      this.code,
      this.title,
      this.retries,
      this.visible,
      this.channel,
      this.audienceId,
      this.minimum,
      this.sequence,
      this.discount,
      this.impressions,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a credit milestone in status new. */
export function newCreditMilestone(code: string, title: string): CreditMilestone {
  return new CreditMilestone(code, title, 0, false, "", "", 0, 0, 0, 0, 0, "new");
}
