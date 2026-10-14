import * as text from "../../../../kit/text.js";

/** Where a tier group is in its life cycle. */
export type TierGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tier group, with what the planners need to act on it. */
export class TierGroup {
  code: string;
  title: string;
  contactEmail: string;
  visible: boolean;
  updatedAt: number;
  cohort: string;
  startsAt: number;
  locale: string;
  priority: number;
  status: TierGroupStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    visible: boolean,
    updatedAt: number,
    cohort: string,
    startsAt: number,
    locale: string,
    priority: number,
    status: TierGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.updatedAt = updatedAt;
    this.cohort = cohort;
    this.startsAt = startsAt;
    this.locale = locale;
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

  canMoveTo(next: TierGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tier group"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.priority - this.updatedAt) * 100) / 100;
  }

  copy(): TierGroup {
    return new TierGroup(
      this.code,
      this.title,
      this.contactEmail,
      this.visible,
      this.updatedAt,
      this.cohort,
      this.startsAt,
      this.locale,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tier group in status idle. */
export function newTierGroup(code: string, title: string): TierGroup {
  return new TierGroup(code, title, "", false, 0, "", 0, "", 0, "idle");
}
