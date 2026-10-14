/**
 * The rolling opt out milestone records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling opt out milestone is in its life cycle. */
export type RollingOptOutMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling opt out milestone. Its code is unique within a tenant. */
export class RollingOptOutMilestone {
  code: string;
  name: string;
  startsAt: number;
  channel: string;
  score: number;
  status: RollingOptOutMilestoneStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    channel: string,
    score: number,
    status: RollingOptOutMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.channel = channel;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingOptOutMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingOptOutMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling opt out milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.score - this.startsAt) * 100) / 100;
  }

  copy(): RollingOptOutMilestone {
    return new RollingOptOutMilestone(this.code, this.name, this.startsAt, this.channel, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling opt out milestone in status requested. */
export function newRollingOptOutMilestone(code: string, name: string): RollingOptOutMilestone {
  return new RollingOptOutMilestone(code, name, 0, "", 0, "requested");
}
