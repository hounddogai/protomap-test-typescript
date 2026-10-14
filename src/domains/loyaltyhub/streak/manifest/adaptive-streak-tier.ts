import * as text from "../../../../kit/text.js";

/** Where a adaptive streak tier is in its life cycle. */
export type AdaptiveStreakTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** One adaptive streak tier, with what the planners need to act on it. */
export class AdaptiveStreakTier {
  code: string;
  label: string;
  retries: number;
  priority: number;
  active: boolean;
  checksum: string;
  minimum: number;
  contactEmail: string;
  title: string;
  ownerId: string;
  channel: string;
  status: AdaptiveStreakTierStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    priority: number,
    active: boolean,
    checksum: string,
    minimum: number,
    contactEmail: string,
    title: string,
    ownerId: string,
    channel: string,
    status: AdaptiveStreakTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.priority = priority;
    this.active = active;
    this.checksum = checksum;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
    this.title = title;
    this.ownerId = ownerId;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveStreakTierStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: AdaptiveStreakTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive streak tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedExposure(): number {
    return Math.round((this.retries + this.minimum) * 100) / 100;
  }

  copy(): AdaptiveStreakTier {
    return new AdaptiveStreakTier(
      this.code,
      this.label,
      this.retries,
      this.priority,
      this.active,
      this.checksum,
      this.minimum,
      this.contactEmail,
      this.title,
      this.ownerId,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive streak tier in status new. */
export function newAdaptiveStreakTier(code: string, label: string): AdaptiveStreakTier {
  return new AdaptiveStreakTier(code, label, 0, 0, false, "", 0, "", "", "", "", "new");
}
