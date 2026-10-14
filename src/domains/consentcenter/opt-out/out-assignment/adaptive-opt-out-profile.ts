import * as text from "../../../../kit/text.js";

/** Where a adaptive opt out profile is in its life cycle. */
export type AdaptiveOptOutProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One adaptive opt out profile, with what the planners need to act on it. */
export class AdaptiveOptOutProfile {
  code: string;
  name: string;
  endsAt: number;
  locale: string;
  threshold: number;
  status: AdaptiveOptOutProfileStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    locale: string,
    threshold: number,
    status: AdaptiveOptOutProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.locale = locale;
    this.threshold = threshold;
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

  canMoveTo(next: AdaptiveOptOutProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveOptOutProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive opt out profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive opt out profile"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.threshold * this.endsAt * 100) / 100;
  }

  copy(): AdaptiveOptOutProfile {
    return new AdaptiveOptOutProfile(this.code, this.name, this.endsAt, this.locale, this.threshold, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive opt out profile in status proposed. */
export function newAdaptiveOptOutProfile(code: string, name: string): AdaptiveOptOutProfile {
  return new AdaptiveOptOutProfile(code, name, 0, "", 0, "proposed");
}
