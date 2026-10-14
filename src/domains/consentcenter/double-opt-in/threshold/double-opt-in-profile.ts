import * as text from "../../../../kit/text.js";

/** Where a double opt in profile is in its life cycle. */
export type DoubleOptInProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A double opt in profile as the double opt in team keeps it. */
export class DoubleOptInProfile {
  code: string;
  name: string;
  utmSource: string;
  durationMinutes: number;
  reviewer: string;
  retries: number;
  bid: number;
  locale: string;
  status: DoubleOptInProfileStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    durationMinutes: number,
    reviewer: string,
    retries: number,
    bid: number,
    locale: string,
    status: DoubleOptInProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.durationMinutes = durationMinutes;
    this.reviewer = reviewer;
    this.retries = retries;
    this.bid = bid;
    this.locale = locale;
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

  canMoveTo(next: DoubleOptInProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DoubleOptInProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round((this.bid + this.durationMinutes) * 100) / 100;
  }

  copy(): DoubleOptInProfile {
    return new DoubleOptInProfile(
      this.code,
      this.name,
      this.utmSource,
      this.durationMinutes,
      this.reviewer,
      this.retries,
      this.bid,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a double opt in profile in status proposed. */
export function newDoubleOptInProfile(code: string, name: string): DoubleOptInProfile {
  return new DoubleOptInProfile(code, name, "", 0, "", 0, 0, "", "proposed");
}
