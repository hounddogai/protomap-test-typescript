/**
 * The challenge baseline records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge baseline is in its life cycle. */
export type ChallengeBaselineStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a challenge baseline and its current status. */
export class ChallengeBaseline {
  code: string;
  label: string;
  phone: string;
  ratio: number;
  segment: string;
  threshold: number;
  version: number;
  description: string;
  startsAt: number;
  quantity: number;
  status: ChallengeBaselineStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    ratio: number,
    segment: string,
    threshold: number,
    version: number,
    description: string,
    startsAt: number,
    quantity: number,
    status: ChallengeBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.ratio = ratio;
    this.segment = segment;
    this.threshold = threshold;
    this.version = version;
    this.description = description;
    this.startsAt = startsAt;
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

  canMoveTo(next: ChallengeBaselineStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ChallengeBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"challenge baseline"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.quantity + this.threshold) * 100) / 100;
  }

  copy(): ChallengeBaseline {
    return new ChallengeBaseline(
      this.code,
      this.label,
      this.phone,
      this.ratio,
      this.segment,
      this.threshold,
      this.version,
      this.description,
      this.startsAt,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a challenge baseline in status draft. */
export function newChallengeBaseline(code: string, label: string): ChallengeBaseline {
  return new ChallengeBaseline(code, label, "", 0, "", 0, 0, "", 0, 0, "draft");
}
