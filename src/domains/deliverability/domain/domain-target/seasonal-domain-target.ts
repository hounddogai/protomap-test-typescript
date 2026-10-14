/**
 * The seasonal domain target records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal domain target is in its life cycle. */
export type SeasonalDomainTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a seasonal domain target and its current status. */
export class SeasonalDomainTarget {
  code: string;
  title: string;
  audienceId: string;
  budget: number;
  campaignRef: string;
  channel: string;
  status: SeasonalDomainTargetStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    budget: number,
    campaignRef: string,
    channel: string,
    status: SeasonalDomainTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.budget = budget;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: SeasonalDomainTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "active" || next === "closed";
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

  moveTo(next: SeasonalDomainTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal domain target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): SeasonalDomainTarget {
    return new SeasonalDomainTarget(
      this.code,
      this.title,
      this.audienceId,
      this.budget,
      this.campaignRef,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal domain target in status draft. */
export function newSeasonalDomainTarget(code: string, title: string): SeasonalDomainTarget {
  return new SeasonalDomainTarget(code, title, "", 0, "", "", "draft");
}
