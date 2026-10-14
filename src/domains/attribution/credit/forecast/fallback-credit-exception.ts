import * as text from "../../../../kit/text.js";

/** Where a fallback credit exception is in its life cycle. */
export type FallbackCreditExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback credit exception as the credit team keeps it. */
export class FallbackCreditException {
  code: string;
  label: string;
  locale: string;
  floorValue: number;
  attempts: number;
  durationMinutes: number;
  clicks: number;
  audienceId: string;
  region: string;
  amount: number;
  status: FallbackCreditExceptionStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    floorValue: number,
    attempts: number,
    durationMinutes: number,
    clicks: number,
    audienceId: string,
    region: string,
    amount: number,
    status: FallbackCreditExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.floorValue = floorValue;
    this.attempts = attempts;
    this.durationMinutes = durationMinutes;
    this.clicks = clicks;
    this.audienceId = audienceId;
    this.region = region;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackCreditExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCreditExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback credit exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback credit exception"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.durationMinutes * this.clicks * 100) / 100;
  }

  copy(): FallbackCreditException {
    return new FallbackCreditException(
      this.code,
      this.label,
      this.locale,
      this.floorValue,
      this.attempts,
      this.durationMinutes,
      this.clicks,
      this.audienceId,
      this.region,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback credit exception in status open. */
export function newFallbackCreditException(code: string, label: string): FallbackCreditException {
  return new FallbackCreditException(code, label, "", 0, 0, 0, 0, "", "", 0, "open");
}
