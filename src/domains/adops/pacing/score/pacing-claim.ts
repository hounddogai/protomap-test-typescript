import * as text from "../../../../kit/text.js";

/** Where a pacing claim is in its life cycle. */
export type PacingClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pacing claim as the pacing team keeps it. */
export class PacingClaim {
  code: string;
  label: string;
  endsAt: number;
  region: string;
  active: boolean;
  conversionRate: number;
  status: PacingClaimStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    region: string,
    active: boolean,
    conversionRate: number,
    status: PacingClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.region = region;
    this.active = active;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: PacingClaimStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round((this.endsAt + this.conversionRate) * 100) / 100;
  }

  copy(): PacingClaim {
    return new PacingClaim(
      this.code,
      this.label,
      this.endsAt,
      this.region,
      this.active,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pacing claim in status open. */
export function newPacingClaim(code: string, label: string): PacingClaim {
  return new PacingClaim(code, label, 0, "", false, 0, "open");
}
