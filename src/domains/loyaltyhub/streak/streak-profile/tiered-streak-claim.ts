import * as text from "../../../../kit/text.js";

/** Where a tiered streak claim is in its life cycle. */
export type TieredStreakClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One tiered streak claim, with what the planners need to act on it. */
export class TieredStreakClaim {
  code: string;
  title: string;
  ownerId: string;
  threshold: number;
  conversionRate: number;
  utmSource: string;
  contactEmail: string;
  label: string;
  journeyId: string;
  status: TieredStreakClaimStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    threshold: number,
    conversionRate: number,
    utmSource: string,
    contactEmail: string,
    label: string,
    journeyId: string,
    status: TieredStreakClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.threshold = threshold;
    this.conversionRate = conversionRate;
    this.utmSource = utmSource;
    this.contactEmail = contactEmail;
    this.label = label;
    this.journeyId = journeyId;
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

  canMoveTo(next: TieredStreakClaimStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
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

  moveTo(next: TieredStreakClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered streak claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered streak claim"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.threshold - this.conversionRate) * 100) / 100;
  }

  copy(): TieredStreakClaim {
    return new TieredStreakClaim(
      this.code,
      this.title,
      this.ownerId,
      this.threshold,
      this.conversionRate,
      this.utmSource,
      this.contactEmail,
      this.label,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered streak claim in status proposed. */
export function newTieredStreakClaim(code: string, title: string): TieredStreakClaim {
  return new TieredStreakClaim(code, title, "", 0, 0, "", "", "", "", "proposed");
}
