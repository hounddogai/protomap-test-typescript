/**
 * The capped opt out request records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped opt out request is in its life cycle. */
export type CappedOptOutRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One capped opt out request, with what the planners need to act on it. */
export class CappedOptOutRequest {
  code: string;
  title: string;
  score: number;
  limit: number;
  externalRef: string;
  campaignRef: string;
  active: boolean;
  variant: string;
  status: CappedOptOutRequestStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    limit: number,
    externalRef: string,
    campaignRef: string,
    active: boolean,
    variant: string,
    status: CappedOptOutRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.limit = limit;
    this.externalRef = externalRef;
    this.campaignRef = campaignRef;
    this.active = active;
    this.variant = variant;
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

  canMoveTo(next: CappedOptOutRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedOptOutRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped opt out request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedVolume(): number {
    return Math.round((this.limit + this.score) * 100) / 100;
  }

  copy(): CappedOptOutRequest {
    return new CappedOptOutRequest(
      this.code,
      this.title,
      this.score,
      this.limit,
      this.externalRef,
      this.campaignRef,
      this.active,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped opt out request in status idle. */
export function newCappedOptOutRequest(code: string, title: string): CappedOptOutRequest {
  return new CappedOptOutRequest(code, title, 0, 0, "", "", false, "", "idle");
}
