import * as text from "../../../../kit/text.js";

/** Where a reputation summary is in its life cycle. */
export type ReputationSummaryStatus = "created" | "validated" | "published" | "retired";

/** The record of a reputation summary and its current status. */
export class ReputationSummary {
  code: string;
  title: string;
  expiresAt: number;
  clicks: number;
  frequencyCap: number;
  startsAt: number;
  bid: number;
  phone: string;
  visible: boolean;
  status: ReputationSummaryStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    clicks: number,
    frequencyCap: number,
    startsAt: number,
    bid: number,
    phone: string,
    visible: boolean,
    status: ReputationSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.clicks = clicks;
    this.frequencyCap = frequencyCap;
    this.startsAt = startsAt;
    this.bid = bid;
    this.phone = phone;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ReputationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reputation summary"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.bid - this.expiresAt) * 100) / 100;
  }

  copy(): ReputationSummary {
    return new ReputationSummary(
      this.code,
      this.title,
      this.expiresAt,
      this.clicks,
      this.frequencyCap,
      this.startsAt,
      this.bid,
      this.phone,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reputation summary in status created. */
export function newReputationSummary(code: string, title: string): ReputationSummary {
  return new ReputationSummary(code, title, 0, 0, 0, 0, 0, "", false, "created");
}
