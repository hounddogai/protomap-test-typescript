/**
 * The legacy badge manifest records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy badge manifest is in its life cycle. */
export type LegacyBadgeManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One legacy badge manifest, with what the planners need to act on it. */
export class LegacyBadgeManifest {
  code: string;
  title: string;
  channel: string;
  discount: number;
  retries: number;
  audienceId: string;
  budget: number;
  status: LegacyBadgeManifestStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    discount: number,
    retries: number,
    audienceId: string,
    budget: number,
    status: LegacyBadgeManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.discount = discount;
    this.retries = retries;
    this.audienceId = audienceId;
    this.budget = budget;
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

  canMoveTo(next: LegacyBadgeManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
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
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyBadgeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy badge manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy badge manifest"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.budget + this.discount) * 100) / 100;
  }

  copy(): LegacyBadgeManifest {
    return new LegacyBadgeManifest(
      this.code,
      this.title,
      this.channel,
      this.discount,
      this.retries,
      this.audienceId,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy badge manifest in status draft. */
export function newLegacyBadgeManifest(code: string, title: string): LegacyBadgeManifest {
  return new LegacyBadgeManifest(code, title, "", 0, 0, "", 0, "draft");
}
