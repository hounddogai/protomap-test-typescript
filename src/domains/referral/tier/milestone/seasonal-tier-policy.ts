import * as text from "../../../../kit/text.js";

/** Where a seasonal tier policy is in its life cycle. */
export type SeasonalTierPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal tier policy, with what the planners need to act on it. */
export class SeasonalTierPolicy {
  code: string;
  title: string;
  pinned: boolean;
  description: string;
  country: string;
  ownerId: string;
  threshold: number;
  status: SeasonalTierPolicyStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    description: string,
    country: string,
    ownerId: string,
    threshold: number,
    status: SeasonalTierPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.description = description;
    this.country = country;
    this.ownerId = ownerId;
    this.threshold = threshold;
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

  canMoveTo(next: SeasonalTierPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: SeasonalTierPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal tier policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal tier policy"} ${this.code}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): SeasonalTierPolicy {
    return new SeasonalTierPolicy(
      this.code,
      this.title,
      this.pinned,
      this.description,
      this.country,
      this.ownerId,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal tier policy in status idle. */
export function newSeasonalTierPolicy(code: string, title: string): SeasonalTierPolicy {
  return new SeasonalTierPolicy(code, title, false, "", "", "", 0, "idle");
}
