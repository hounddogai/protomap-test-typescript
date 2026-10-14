import * as text from "../../../../kit/text.js";

/** Where a legacy nudge notice is in its life cycle. */
export type LegacyNudgeNoticeStatus = "created" | "validated" | "published" | "retired";

/** A legacy nudge notice as the nudge team keeps it. */
export class LegacyNudgeNotice {
  code: string;
  label: string;
  conversionRate: number;
  pinned: boolean;
  priority: number;
  channel: string;
  retries: number;
  updatedAt: number;
  version: number;
  reviewer: string;
  windowDays: number;
  status: LegacyNudgeNoticeStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    pinned: boolean,
    priority: number,
    channel: string,
    retries: number,
    updatedAt: number,
    version: number,
    reviewer: string,
    windowDays: number,
    status: LegacyNudgeNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
    this.priority = priority;
    this.channel = channel;
    this.retries = retries;
    this.updatedAt = updatedAt;
    this.version = version;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyNudgeNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyNudgeNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy nudge notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveValue(): number {
    return Math.round((this.windowDays - this.updatedAt) * 100) / 100;
  }

  copy(): LegacyNudgeNotice {
    return new LegacyNudgeNotice(
      this.code,
      this.label,
      this.conversionRate,
      this.pinned,
      this.priority,
      this.channel,
      this.retries,
      this.updatedAt,
      this.version,
      this.reviewer,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy nudge notice in status created. */
export function newLegacyNudgeNotice(code: string, label: string): LegacyNudgeNotice {
  return new LegacyNudgeNotice(code, label, 0, false, 0, "", 0, 0, 0, "", 0, "created");
}
