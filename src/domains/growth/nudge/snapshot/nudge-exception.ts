import * as text from "../../../../kit/text.js";

/** Where a nudge exception is in its life cycle. */
export type NudgeExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A nudge exception as the nudge team keeps it. */
export class NudgeException {
  code: string;
  label: string;
  expiresAt: number;
  ratio: number;
  floorValue: number;
  threshold: number;
  timezone: string;
  limit: number;
  impressions: number;
  status: NudgeExceptionStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    ratio: number,
    floorValue: number,
    threshold: number,
    timezone: string,
    limit: number,
    impressions: number,
    status: NudgeExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.floorValue = floorValue;
    this.threshold = threshold;
    this.timezone = timezone;
    this.limit = limit;
    this.impressions = impressions;
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

  canMoveTo(next: NudgeExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: NudgeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round((this.ratio - this.limit) * 100) / 100;
  }

  copy(): NudgeException {
    return new NudgeException(
      this.code,
      this.label,
      this.expiresAt,
      this.ratio,
      this.floorValue,
      this.threshold,
      this.timezone,
      this.limit,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a nudge exception in status draft. */
export function newNudgeException(code: string, label: string): NudgeException {
  return new NudgeException(code, label, 0, 0, 0, 0, "", 0, 0, "draft");
}
