/**
 * The primary path digest records of attribution's path work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary path digest is in its life cycle. */
export type PrimaryPathDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a primary path digest and its current status. */
export class PrimaryPathDigest {
  code: string;
  label: string;
  utmSource: string;
  timezone: string;
  durationMinutes: number;
  attempts: number;
  startsAt: number;
  updatedAt: number;
  score: number;
  status: PrimaryPathDigestStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    timezone: string,
    durationMinutes: number,
    attempts: number,
    startsAt: number,
    updatedAt: number,
    score: number,
    status: PrimaryPathDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.timezone = timezone;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.score = score;
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

  canMoveTo(next: PrimaryPathDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PrimaryPathDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary path digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary path digest"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.score - this.updatedAt) * 100) / 100;
  }

  copy(): PrimaryPathDigest {
    return new PrimaryPathDigest(
      this.code,
      this.label,
      this.utmSource,
      this.timezone,
      this.durationMinutes,
      this.attempts,
      this.startsAt,
      this.updatedAt,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary path digest in status idle. */
export function newPrimaryPathDigest(code: string, label: string): PrimaryPathDigest {
  return new PrimaryPathDigest(code, label, "", "", 0, 0, 0, 0, 0, "idle");
}
