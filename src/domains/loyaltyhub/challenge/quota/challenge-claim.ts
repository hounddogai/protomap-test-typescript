import * as text from "../../../../kit/text.js";

/** Where a challenge claim is in its life cycle. */
export type ChallengeClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A challenge claim. Its code is unique within a tenant. */
export class ChallengeClaim {
  code: string;
  label: string;
  discount: number;
  impressions: number;
  title: string;
  expiresAt: number;
  threshold: number;
  country: string;
  summary: string;
  utmSource: string;
  priority: number;
  status: ChallengeClaimStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    impressions: number,
    title: string,
    expiresAt: number,
    threshold: number,
    country: string,
    summary: string,
    utmSource: string,
    priority: number,
    status: ChallengeClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.impressions = impressions;
    this.title = title;
    this.expiresAt = expiresAt;
    this.threshold = threshold;
    this.country = country;
    this.summary = summary;
    this.utmSource = utmSource;
    this.priority = priority;
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

  canMoveTo(next: ChallengeClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ChallengeClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"challenge claim"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.impressions + this.threshold) * 100) / 100;
  }

  copy(): ChallengeClaim {
    return new ChallengeClaim(
      this.code,
      this.label,
      this.discount,
      this.impressions,
      this.title,
      this.expiresAt,
      this.threshold,
      this.country,
      this.summary,
      this.utmSource,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a challenge claim in status idle. */
export function newChallengeClaim(code: string, label: string): ChallengeClaim {
  return new ChallengeClaim(code, label, 0, 0, "", 0, 0, "", "", "", 0, "idle");
}
