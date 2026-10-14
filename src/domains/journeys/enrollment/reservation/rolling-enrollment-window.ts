import * as text from "../../../../kit/text.js";

/** Where a rolling enrollment window is in its life cycle. */
export type RollingEnrollmentWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling enrollment window, with what the planners need to act on it. */
export class RollingEnrollmentWindow {
  code: string;
  title: string;
  currency: string;
  archived: boolean;
  approved: boolean;
  summary: string;
  minimum: number;
  updatedAt: number;
  impressions: number;
  tags: string[];
  clicks: number;
  status: RollingEnrollmentWindowStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    archived: boolean,
    approved: boolean,
    summary: string,
    minimum: number,
    updatedAt: number,
    impressions: number,
    tags: string[],
    clicks: number,
    status: RollingEnrollmentWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.archived = archived;
    this.approved = approved;
    this.summary = summary;
    this.minimum = minimum;
    this.updatedAt = updatedAt;
    this.impressions = impressions;
    this.tags = tags;
    this.clicks = clicks;
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

  canMoveTo(next: RollingEnrollmentWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingEnrollmentWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling enrollment window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling enrollment window"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.updatedAt + this.minimum) * 100) / 100;
  }

  copy(): RollingEnrollmentWindow {
    return new RollingEnrollmentWindow(
      this.code,
      this.title,
      this.currency,
      this.archived,
      this.approved,
      this.summary,
      this.minimum,
      this.updatedAt,
      this.impressions,
      this.tags,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling enrollment window in status planned. */
export function newRollingEnrollmentWindow(code: string, title: string): RollingEnrollmentWindow {
  return new RollingEnrollmentWindow(code, title, "", false, false, "", 0, 0, 0, [], 0, "planned");
}
