/**
 * The fraud check checkpoint records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check checkpoint is in its life cycle. */
export type FraudCheckCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a fraud check checkpoint and its current status. */
export class FraudCheckCheckpoint {
  code: string;
  title: string;
  channel: string;
  country: string;
  margin: number;
  reviewer: string;
  status: FraudCheckCheckpointStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    country: string,
    margin: number,
    reviewer: string,
    status: FraudCheckCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.country = country;
    this.margin = margin;
    this.reviewer = reviewer;
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

  canMoveTo(next: FraudCheckCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FraudCheckCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): FraudCheckCheckpoint {
    return new FraudCheckCheckpoint(
      this.code,
      this.title,
      this.channel,
      this.country,
      this.margin,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fraud check checkpoint in status draft. */
export function newFraudCheckCheckpoint(code: string, title: string): FraudCheckCheckpoint {
  return new FraudCheckCheckpoint(code, title, "", "", 0, "", "draft");
}
