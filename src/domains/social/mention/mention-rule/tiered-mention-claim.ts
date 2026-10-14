import * as text from "../../../../kit/text.js";

/** Where a tiered mention claim is in its life cycle. */
export type TieredMentionClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered mention claim. Its code is unique within a tenant. */
export class TieredMentionClaim {
  code: string;
  name: string;
  currency: string;
  reviewer: string;
  cohort: string;
  sendAt: number;
  region: string;
  status: TieredMentionClaimStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    reviewer: string,
    cohort: string,
    sendAt: number,
    region: string,
    status: TieredMentionClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.reviewer = reviewer;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.region = region;
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

  canMoveTo(next: TieredMentionClaimStatus): boolean {
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

  moveTo(next: TieredMentionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered mention claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered mention claim"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): TieredMentionClaim {
    return new TieredMentionClaim(
      this.code,
      this.name,
      this.currency,
      this.reviewer,
      this.cohort,
      this.sendAt,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered mention claim in status requested. */
export function newTieredMentionClaim(code: string, name: string): TieredMentionClaim {
  return new TieredMentionClaim(code, name, "", "", "", 0, "", "requested");
}
