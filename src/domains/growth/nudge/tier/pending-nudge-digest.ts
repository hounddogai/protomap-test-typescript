import * as text from "../../../../kit/text.js";

/** Where a pending nudge digest is in its life cycle. */
export type PendingNudgeDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending nudge digest as the nudge team keeps it. */
export class PendingNudgeDigest {
  code: string;
  name: string;
  minimum: number;
  endsAt: number;
  cost: number;
  country: string;
  currency: string;
  frequencyCap: number;
  reviewer: string;
  expiresAt: number;
  campaignRef: string;
  status: PendingNudgeDigestStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    endsAt: number,
    cost: number,
    country: string,
    currency: string,
    frequencyCap: number,
    reviewer: string,
    expiresAt: number,
    campaignRef: string,
    status: PendingNudgeDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.cost = cost;
    this.country = country;
    this.currency = currency;
    this.frequencyCap = frequencyCap;
    this.reviewer = reviewer;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: PendingNudgeDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingNudgeDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending nudge digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending nudge digest"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.cost + this.frequencyCap) * 100) / 100;
  }

  copy(): PendingNudgeDigest {
    return new PendingNudgeDigest(
      this.code,
      this.name,
      this.minimum,
      this.endsAt,
      this.cost,
      this.country,
      this.currency,
      this.frequencyCap,
      this.reviewer,
      this.expiresAt,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending nudge digest in status requested. */
export function newPendingNudgeDigest(code: string, name: string): PendingNudgeDigest {
  return new PendingNudgeDigest(code, name, 0, 0, 0, "", "", 0, "", 0, "", "requested");
}
