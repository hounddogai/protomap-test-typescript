import * as text from "../../../../kit/text.js";

/** Where a scheduled window tier is in its life cycle. */
export type ScheduledWindowTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled window tier. Its code is unique within a tenant. */
export class ScheduledWindowTier {
  code: string;
  title: string;
  summary: string;
  expiresAt: number;
  impressions: number;
  status: ScheduledWindowTierStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    expiresAt: number,
    impressions: number,
    status: ScheduledWindowTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.expiresAt = expiresAt;
    this.impressions = impressions;
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

  canMoveTo(next: ScheduledWindowTierStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledWindowTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled window tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.impressions + this.expiresAt) * 100) / 100;
  }

  copy(): ScheduledWindowTier {
    return new ScheduledWindowTier(this.code, this.title, this.summary, this.expiresAt, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled window tier in status planned. */
export function newScheduledWindowTier(code: string, title: string): ScheduledWindowTier {
  return new ScheduledWindowTier(code, title, "", 0, 0, "planned");
}
