/**
 * The capped touchpoint milestone records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped touchpoint milestone is in its life cycle. */
export type CappedTouchpointMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped touchpoint milestone as the touchpoint team keeps it. */
export class CappedTouchpointMilestone {
  code: string;
  name: string;
  approved: boolean;
  utmSource: string;
  ratio: number;
  tags: string[];
  campaignRef: string;
  status: CappedTouchpointMilestoneStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    utmSource: string,
    ratio: number,
    tags: string[],
    campaignRef: string,
    status: CappedTouchpointMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.tags = tags;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: CappedTouchpointMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedTouchpointMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped touchpoint milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped touchpoint milestone"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): CappedTouchpointMilestone {
    return new CappedTouchpointMilestone(
      this.code,
      this.name,
      this.approved,
      this.utmSource,
      this.ratio,
      this.tags,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a capped touchpoint milestone in status idle. */
export function newCappedTouchpointMilestone(code: string, name: string): CappedTouchpointMilestone {
  return new CappedTouchpointMilestone(code, name, false, "", 0, [], "", "idle");
}
