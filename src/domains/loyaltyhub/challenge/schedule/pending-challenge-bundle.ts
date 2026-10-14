import * as text from "../../../../kit/text.js";

/** Where a pending challenge bundle is in its life cycle. */
export type PendingChallengeBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending challenge bundle, with what the planners need to act on it. */
export class PendingChallengeBundle {
  code: string;
  name: string;
  floorValue: number;
  attempts: number;
  frequencyCap: number;
  category: string;
  margin: number;
  locale: string;
  version: number;
  retries: number;
  timezone: string;
  status: PendingChallengeBundleStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    attempts: number,
    frequencyCap: number,
    category: string,
    margin: number,
    locale: string,
    version: number,
    retries: number,
    timezone: string,
    status: PendingChallengeBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.category = category;
    this.margin = margin;
    this.locale = locale;
    this.version = version;
    this.retries = retries;
    this.timezone = timezone;
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

  canMoveTo(next: PendingChallengeBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingChallengeBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending challenge bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round(this.margin * this.attempts * 100) / 100;
  }

  copy(): PendingChallengeBundle {
    return new PendingChallengeBundle(
      this.code,
      this.name,
      this.floorValue,
      this.attempts,
      this.frequencyCap,
      this.category,
      this.margin,
      this.locale,
      this.version,
      this.retries,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending challenge bundle in status idle. */
export function newPendingChallengeBundle(code: string, name: string): PendingChallengeBundle {
  return new PendingChallengeBundle(code, name, 0, 0, 0, "", 0, "", 0, 0, "", "idle");
}
