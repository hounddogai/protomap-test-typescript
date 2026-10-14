import * as text from "../../../../kit/text.js";

/** Where a badge override is in its life cycle. */
export type BadgeOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A badge override. Its code is unique within a tenant. */
export class BadgeOverride {
  code: string;
  title: string;
  approved: boolean;
  channel: string;
  batchSize: number;
  durationMinutes: number;
  attempts: number;
  status: BadgeOverrideStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    channel: string,
    batchSize: number,
    durationMinutes: number,
    attempts: number,
    status: BadgeOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.channel = channel;
    this.batchSize = batchSize;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
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

  canMoveTo(next: BadgeOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"badge override"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.batchSize * this.attempts * 100) / 100;
  }

  copy(): BadgeOverride {
    return new BadgeOverride(
      this.code,
      this.title,
      this.approved,
      this.channel,
      this.batchSize,
      this.durationMinutes,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a badge override in status requested. */
export function newBadgeOverride(code: string, title: string): BadgeOverride {
  return new BadgeOverride(code, title, false, "", 0, 0, 0, "requested");
}
