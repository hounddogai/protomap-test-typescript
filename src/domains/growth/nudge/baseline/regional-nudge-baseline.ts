/**
 * The regional nudge baseline records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional nudge baseline is in its life cycle. */
export type RegionalNudgeBaselineStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A regional nudge baseline. Its code is unique within a tenant. */
export class RegionalNudgeBaseline {
  code: string;
  title: string;
  budget: number;
  utmSource: string;
  clicks: number;
  sendAt: number;
  reviewer: string;
  revision: number;
  archived: boolean;
  cost: number;
  status: RegionalNudgeBaselineStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    utmSource: string,
    clicks: number,
    sendAt: number,
    reviewer: string,
    revision: number,
    archived: boolean,
    cost: number,
    status: RegionalNudgeBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.utmSource = utmSource;
    this.clicks = clicks;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.revision = revision;
    this.archived = archived;
    this.cost = cost;
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

  canMoveTo(next: RegionalNudgeBaselineStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalNudgeBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional nudge baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.budget * this.revision * 100) / 100;
  }

  copy(): RegionalNudgeBaseline {
    return new RegionalNudgeBaseline(
      this.code,
      this.title,
      this.budget,
      this.utmSource,
      this.clicks,
      this.sendAt,
      this.reviewer,
      this.revision,
      this.archived,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a regional nudge baseline in status draft. */
export function newRegionalNudgeBaseline(code: string, title: string): RegionalNudgeBaseline {
  return new RegionalNudgeBaseline(code, title, 0, "", 0, 0, "", 0, false, 0, "draft");
}
