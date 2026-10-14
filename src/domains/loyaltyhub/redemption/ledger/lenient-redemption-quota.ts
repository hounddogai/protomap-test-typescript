import * as text from "../../../../kit/text.js";

/** Where a lenient redemption quota is in its life cycle. */
export type LenientRedemptionQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient redemption quota. Its code is unique within a tenant. */
export class LenientRedemptionQuota {
  code: string;
  name: string;
  sequence: number;
  active: boolean;
  revision: number;
  maximum: number;
  contactEmail: string;
  source: string;
  score: number;
  limit: number;
  status: LenientRedemptionQuotaStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    active: boolean,
    revision: number,
    maximum: number,
    contactEmail: string,
    source: string,
    score: number,
    limit: number,
    status: LenientRedemptionQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.active = active;
    this.revision = revision;
    this.maximum = maximum;
    this.contactEmail = contactEmail;
    this.source = source;
    this.score = score;
    this.limit = limit;
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

  canMoveTo(next: LenientRedemptionQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
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

  moveTo(next: LenientRedemptionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient redemption quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"lenient redemption quota"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.limit * this.maximum * 100) / 100;
  }

  copy(): LenientRedemptionQuota {
    return new LenientRedemptionQuota(
      this.code,
      this.name,
      this.sequence,
      this.active,
      this.revision,
      this.maximum,
      this.contactEmail,
      this.source,
      this.score,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient redemption quota in status proposed. */
export function newLenientRedemptionQuota(code: string, name: string): LenientRedemptionQuota {
  return new LenientRedemptionQuota(code, name, 0, false, 0, 0, "", "", 0, 0, "proposed");
}
