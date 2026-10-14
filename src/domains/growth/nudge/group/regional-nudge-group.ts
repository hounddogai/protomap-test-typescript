/**
 * The regional nudge group records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional nudge group is in its life cycle. */
export type RegionalNudgeGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One regional nudge group, with what the planners need to act on it. */
export class RegionalNudgeGroup {
  code: string;
  title: string;
  country: string;
  externalRef: string;
  reviewer: string;
  audienceId: string;
  region: string;
  ownerId: string;
  quantity: number;
  status: RegionalNudgeGroupStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    externalRef: string,
    reviewer: string,
    audienceId: string,
    region: string,
    ownerId: string,
    quantity: number,
    status: RegionalNudgeGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.externalRef = externalRef;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
    this.region = region;
    this.ownerId = ownerId;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalNudgeGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalNudgeGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional nudge group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional nudge group"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): RegionalNudgeGroup {
    return new RegionalNudgeGroup(
      this.code,
      this.title,
      this.country,
      this.externalRef,
      this.reviewer,
      this.audienceId,
      this.region,
      this.ownerId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional nudge group in status idle. */
export function newRegionalNudgeGroup(code: string, title: string): RegionalNudgeGroup {
  return new RegionalNudgeGroup(code, title, "", "", "", "", "", "", 0, "idle");
}
