/**
 * The redemption batch records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption batch is in its life cycle. */
export type RedemptionBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One redemption batch, with what the planners need to act on it. */
export class RedemptionBatch {
  code: string;
  title: string;
  margin: number;
  audienceId: string;
  ratio: number;
  campaignRef: string;
  journeyId: string;
  capacity: number;
  budget: number;
  limit: number;
  status: RedemptionBatchStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    audienceId: string,
    ratio: number,
    campaignRef: string,
    journeyId: string,
    capacity: number,
    budget: number,
    limit: number,
    status: RedemptionBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.capacity = capacity;
    this.budget = budget;
    this.limit = limit;
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

  canMoveTo(next: RedemptionBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
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
        switch (next) {
          case "draining":
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

  moveTo(next: RedemptionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"redemption batch"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.limit - this.budget) * 100) / 100;
  }

  copy(): RedemptionBatch {
    return new RedemptionBatch(
      this.code,
      this.title,
      this.margin,
      this.audienceId,
      this.ratio,
      this.campaignRef,
      this.journeyId,
      this.capacity,
      this.budget,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a redemption batch in status idle. */
export function newRedemptionBatch(code: string, title: string): RedemptionBatch {
  return new RedemptionBatch(code, title, 0, "", 0, "", "", 0, 0, 0, "idle");
}
