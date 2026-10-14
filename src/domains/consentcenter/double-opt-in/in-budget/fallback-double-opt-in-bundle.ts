import * as text from "../../../../kit/text.js";

/** Where a fallback double opt in bundle is in its life cycle. */
export type FallbackDoubleOptInBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback double opt in bundle as the double opt in team keeps it. */
export class FallbackDoubleOptInBundle {
  code: string;
  name: string;
  endsAt: number;
  cohort: string;
  score: number;
  rate: number;
  locale: string;
  timezone: string;
  status: FallbackDoubleOptInBundleStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    cohort: string,
    score: number,
    rate: number,
    locale: string,
    timezone: string,
    status: FallbackDoubleOptInBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.cohort = cohort;
    this.score = score;
    this.rate = rate;
    this.locale = locale;
    this.timezone = timezone;
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

  canMoveTo(next: FallbackDoubleOptInBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FallbackDoubleOptInBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback double opt in bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fallback double opt in bundle"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.score + this.rate) * 100) / 100;
  }

  copy(): FallbackDoubleOptInBundle {
    return new FallbackDoubleOptInBundle(
      this.code,
      this.name,
      this.endsAt,
      this.cohort,
      this.score,
      this.rate,
      this.locale,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback double opt in bundle in status draft. */
export function newFallbackDoubleOptInBundle(code: string, name: string): FallbackDoubleOptInBundle {
  return new FallbackDoubleOptInBundle(code, name, 0, "", 0, 0, "", "", "draft");
}
