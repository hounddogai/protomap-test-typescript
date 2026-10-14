import * as text from "../../../../kit/text.js";

/** Where a seasonal paywall digest is in its life cycle. */
export type SeasonalPaywallDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal paywall digest as the paywall team keeps it. */
export class SeasonalPaywallDigest {
  code: string;
  name: string;
  windowDays: number;
  attempts: number;
  revision: number;
  status: SeasonalPaywallDigestStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    attempts: number,
    revision: number,
    status: SeasonalPaywallDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.attempts = attempts;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalPaywallDigestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SeasonalPaywallDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal paywall digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.revision + this.attempts) * 100) / 100;
  }

  copy(): SeasonalPaywallDigest {
    return new SeasonalPaywallDigest(this.code, this.name, this.windowDays, this.attempts, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal paywall digest in status open. */
export function newSeasonalPaywallDigest(code: string, name: string): SeasonalPaywallDigest {
  return new SeasonalPaywallDigest(code, name, 0, 0, 0, "open");
}
