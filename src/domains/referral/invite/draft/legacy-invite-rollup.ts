import * as text from "../../../../kit/text.js";

/** Where a legacy invite rollup is in its life cycle. */
export type LegacyInviteRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy invite rollup as the invite team keeps it. */
export class LegacyInviteRollup {
  code: string;
  title: string;
  impressions: number;
  threshold: number;
  windowDays: number;
  audienceId: string;
  label: string;
  timezone: string;
  status: LegacyInviteRollupStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    threshold: number,
    windowDays: number,
    audienceId: string,
    label: string,
    timezone: string,
    status: LegacyInviteRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.threshold = threshold;
    this.windowDays = windowDays;
    this.audienceId = audienceId;
    this.label = label;
    this.timezone = timezone;
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

  canMoveTo(next: LegacyInviteRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "stopped";
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

  moveTo(next: LegacyInviteRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy invite rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"legacy invite rollup"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.threshold - this.impressions) * 100) / 100;
  }

  copy(): LegacyInviteRollup {
    return new LegacyInviteRollup(
      this.code,
      this.title,
      this.impressions,
      this.threshold,
      this.windowDays,
      this.audienceId,
      this.label,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy invite rollup in status idle. */
export function newLegacyInviteRollup(code: string, title: string): LegacyInviteRollup {
  return new LegacyInviteRollup(code, title, 0, 0, 0, "", "", "", "idle");
}
