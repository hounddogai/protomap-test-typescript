import * as text from "../../../../kit/text.js";

/** Where a legacy double opt in segment is in its life cycle. */
export type LegacyDoubleOptInSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** One legacy double opt in segment, with what the planners need to act on it. */
export class LegacyDoubleOptInSegment {
  code: string;
  title: string;
  conversionRate: number;
  windowDays: number;
  durationMinutes: number;
  updatedAt: number;
  attempts: number;
  campaignRef: string;
  status: LegacyDoubleOptInSegmentStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    windowDays: number,
    durationMinutes: number,
    updatedAt: number,
    attempts: number,
    campaignRef: string,
    status: LegacyDoubleOptInSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.windowDays = windowDays;
    this.durationMinutes = durationMinutes;
    this.updatedAt = updatedAt;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: LegacyDoubleOptInSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyDoubleOptInSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy double opt in segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round(this.conversionRate * this.durationMinutes * 100) / 100;
  }

  copy(): LegacyDoubleOptInSegment {
    return new LegacyDoubleOptInSegment(
      this.code,
      this.title,
      this.conversionRate,
      this.windowDays,
      this.durationMinutes,
      this.updatedAt,
      this.attempts,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy double opt in segment in status requested. */
export function newLegacyDoubleOptInSegment(code: string, title: string): LegacyDoubleOptInSegment {
  return new LegacyDoubleOptInSegment(code, title, 0, 0, 0, 0, 0, "", "requested");
}
