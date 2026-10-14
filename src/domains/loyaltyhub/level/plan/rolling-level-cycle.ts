import * as text from "../../../../kit/text.js";

/** Where a rolling level cycle is in its life cycle. */
export type RollingLevelCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling level cycle, with what the planners need to act on it. */
export class RollingLevelCycle {
  code: string;
  title: string;
  locale: string;
  endsAt: number;
  windowDays: number;
  impressions: number;
  approved: boolean;
  revision: number;
  tags: string[];
  version: number;
  status: RollingLevelCycleStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    endsAt: number,
    windowDays: number,
    impressions: number,
    approved: boolean,
    revision: number,
    tags: string[],
    version: number,
    status: RollingLevelCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.endsAt = endsAt;
    this.windowDays = windowDays;
    this.impressions = impressions;
    this.approved = approved;
    this.revision = revision;
    this.tags = tags;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingLevelCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingLevelCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling level cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round(this.windowDays * this.revision * 100) / 100;
  }

  copy(): RollingLevelCycle {
    return new RollingLevelCycle(
      this.code,
      this.title,
      this.locale,
      this.endsAt,
      this.windowDays,
      this.impressions,
      this.approved,
      this.revision,
      this.tags,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling level cycle in status planned. */
export function newRollingLevelCycle(code: string, title: string): RollingLevelCycle {
  return new RollingLevelCycle(code, title, "", 0, 0, 0, false, 0, [], 0, "planned");
}
