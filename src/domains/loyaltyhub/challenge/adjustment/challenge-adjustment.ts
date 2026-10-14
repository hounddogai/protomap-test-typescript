/**
 * The challenge adjustment records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge adjustment is in its life cycle. */
export type ChallengeAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A challenge adjustment as the challenge team keeps it. */
export class ChallengeAdjustment {
  code: string;
  name: string;
  variant: string;
  openRate: number;
  locale: string;
  journeyId: string;
  startsAt: number;
  utmSource: string;
  createdAt: number;
  segment: string;
  status: ChallengeAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    openRate: number,
    locale: string,
    journeyId: string,
    startsAt: number,
    utmSource: string,
    createdAt: number,
    segment: string,
    status: ChallengeAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.openRate = openRate;
    this.locale = locale;
    this.journeyId = journeyId;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.createdAt = createdAt;
    this.segment = segment;
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

  canMoveTo(next: ChallengeAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.openRate + this.startsAt) * 100) / 100;
  }

  copy(): ChallengeAdjustment {
    return new ChallengeAdjustment(
      this.code,
      this.name,
      this.variant,
      this.openRate,
      this.locale,
      this.journeyId,
      this.startsAt,
      this.utmSource,
      this.createdAt,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a challenge adjustment in status requested. */
export function newChallengeAdjustment(code: string, name: string): ChallengeAdjustment {
  return new ChallengeAdjustment(code, name, "", 0, "", "", 0, "", 0, "", "requested");
}
