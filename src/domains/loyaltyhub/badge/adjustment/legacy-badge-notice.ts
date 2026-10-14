import * as text from "../../../../kit/text.js";

/** Where a legacy badge notice is in its life cycle. */
export type LegacyBadgeNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy badge notice as the badge team keeps it. */
export class LegacyBadgeNotice {
  code: string;
  label: string;
  endsAt: number;
  title: string;
  timezone: string;
  createdAt: number;
  status: LegacyBadgeNoticeStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    title: string,
    timezone: string,
    createdAt: number,
    status: LegacyBadgeNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.title = title;
    this.timezone = timezone;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyBadgeNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyBadgeNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy badge notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"legacy badge notice"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.createdAt - this.endsAt) * 100) / 100;
  }

  copy(): LegacyBadgeNotice {
    return new LegacyBadgeNotice(
      this.code,
      this.label,
      this.endsAt,
      this.title,
      this.timezone,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy badge notice in status proposed. */
export function newLegacyBadgeNotice(code: string, label: string): LegacyBadgeNotice {
  return new LegacyBadgeNotice(code, label, 0, "", "", 0, "proposed");
}
