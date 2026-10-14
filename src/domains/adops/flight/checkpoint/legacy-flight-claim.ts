import * as text from "../../../../kit/text.js";

/** Where a legacy flight claim is in its life cycle. */
export type LegacyFlightClaimStatus = "created" | "validated" | "published" | "retired";

/** One legacy flight claim, with what the planners need to act on it. */
export class LegacyFlightClaim {
  code: string;
  title: string;
  phone: string;
  cohort: string;
  createdAt: number;
  frequencyCap: number;
  status: LegacyFlightClaimStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    cohort: string,
    createdAt: number,
    frequencyCap: number,
    status: LegacyFlightClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyFlightClaimStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyFlightClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy flight claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedExposure(): number {
    return Math.round(this.frequencyCap * this.createdAt * 100) / 100;
  }

  copy(): LegacyFlightClaim {
    return new LegacyFlightClaim(
      this.code,
      this.title,
      this.phone,
      this.cohort,
      this.createdAt,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy flight claim in status created. */
export function newLegacyFlightClaim(code: string, title: string): LegacyFlightClaim {
  return new LegacyFlightClaim(code, title, "", "", 0, 0, "created");
}
