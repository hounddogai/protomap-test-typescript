/**
 * The tiered challenge exception records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered challenge exception is in its life cycle. */
export type TieredChallengeExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered challenge exception as the challenge team keeps it. */
export class TieredChallengeException {
  code: string;
  title: string;
  campaignRef: string;
  updatedAt: number;
  phone: string;
  status: TieredChallengeExceptionStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    updatedAt: number,
    phone: string,
    status: TieredChallengeExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.updatedAt = updatedAt;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredChallengeExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredChallengeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered challenge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): TieredChallengeException {
    return new TieredChallengeException(
      this.code,
      this.title,
      this.campaignRef,
      this.updatedAt,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered challenge exception in status planned. */
export function newTieredChallengeException(code: string, title: string): TieredChallengeException {
  return new TieredChallengeException(code, title, "", 0, "", "planned");
}
