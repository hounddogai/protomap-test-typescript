import * as text from "../../../../kit/text.js";

/** Where a badge group is in its life cycle. */
export type BadgeGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** One badge group, with what the planners need to act on it. */
export class BadgeGroup {
  code: string;
  title: string;
  graceDays: number;
  retries: number;
  impressions: number;
  windowDays: number;
  revision: number;
  sequence: number;
  status: BadgeGroupStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    retries: number,
    impressions: number,
    windowDays: number,
    revision: number,
    sequence: number,
    status: BadgeGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.retries = retries;
    this.impressions = impressions;
    this.windowDays = windowDays;
    this.revision = revision;
    this.sequence = sequence;
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

  canMoveTo(next: BadgeGroupStatus): boolean {
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BadgeGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"badge group"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.retries - this.graceDays) * 100) / 100;
  }

  copy(): BadgeGroup {
    return new BadgeGroup(
      this.code,
      this.title,
      this.graceDays,
      this.retries,
      this.impressions,
      this.windowDays,
      this.revision,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a badge group in status requested. */
export function newBadgeGroup(code: string, title: string): BadgeGroup {
  return new BadgeGroup(code, title, 0, 0, 0, 0, 0, 0, "requested");
}
