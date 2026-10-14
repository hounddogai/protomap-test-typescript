/**
 * The redemption summary records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption summary is in its life cycle. */
export type RedemptionSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a redemption summary and its current status. */
export class RedemptionSummary {
  code: string;
  title: string;
  source: string;
  description: string;
  notes: string;
  channel: string;
  tags: string[];
  approved: boolean;
  audienceId: string;
  quantity: number;
  status: RedemptionSummaryStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    description: string,
    notes: string,
    channel: string,
    tags: string[],
    approved: boolean,
    audienceId: string,
    quantity: number,
    status: RedemptionSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.description = description;
    this.notes = notes;
    this.channel = channel;
    this.tags = tags;
    this.approved = approved;
    this.audienceId = audienceId;
    this.quantity = quantity;
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

  canMoveTo(next: RedemptionSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"redemption summary"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): RedemptionSummary {
    return new RedemptionSummary(
      this.code,
      this.title,
      this.source,
      this.description,
      this.notes,
      this.channel,
      this.tags,
      this.approved,
      this.audienceId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a redemption summary in status draft. */
export function newRedemptionSummary(code: string, title: string): RedemptionSummary {
  return new RedemptionSummary(code, title, "", "", "", "", [], false, "", 0, "draft");
}
