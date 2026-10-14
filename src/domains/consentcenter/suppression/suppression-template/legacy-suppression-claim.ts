import * as text from "../../../../kit/text.js";

/** Where a legacy suppression claim is in its life cycle. */
export type LegacySuppressionClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy suppression claim as the suppression team keeps it. */
export class LegacySuppressionClaim {
  code: string;
  name: string;
  country: string;
  revision: number;
  reviewer: string;
  variant: string;
  segment: string;
  status: LegacySuppressionClaimStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    revision: number,
    reviewer: string,
    variant: string,
    segment: string,
    status: LegacySuppressionClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.revision = revision;
    this.reviewer = reviewer;
    this.variant = variant;
    this.segment = segment;
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

  canMoveTo(next: LegacySuppressionClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacySuppressionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy suppression claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): LegacySuppressionClaim {
    return new LegacySuppressionClaim(
      this.code,
      this.name,
      this.country,
      this.revision,
      this.reviewer,
      this.variant,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy suppression claim in status draft. */
export function newLegacySuppressionClaim(code: string, name: string): LegacySuppressionClaim {
  return new LegacySuppressionClaim(code, name, "", 0, "", "", "", "draft");
}
