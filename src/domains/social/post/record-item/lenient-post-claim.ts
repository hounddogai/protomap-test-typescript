import * as text from "../../../../kit/text.js";

/** Where a lenient post claim is in its life cycle. */
export type LenientPostClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient post claim as the post team keeps it. */
export class LenientPostClaim {
  code: string;
  title: string;
  journeyId: string;
  clicks: number;
  utmSource: string;
  status: LenientPostClaimStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    clicks: number,
    utmSource: string,
    status: LenientPostClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.clicks = clicks;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPostClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPostClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient post claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): LenientPostClaim {
    return new LenientPostClaim(this.code, this.title, this.journeyId, this.clicks, this.utmSource, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient post claim in status planned. */
export function newLenientPostClaim(code: string, title: string): LenientPostClaim {
  return new LenientPostClaim(code, title, "", 0, "", "planned");
}
