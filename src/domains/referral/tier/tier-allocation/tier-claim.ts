import * as text from "../../../../kit/text.js";

/** Where a tier claim is in its life cycle. */
export type TierClaimStatus = "created" | "validated" | "published" | "retired";

/** The record of a tier claim and its current status. */
export class TierClaim {
  code: string;
  name: string;
  title: string;
  ownerId: string;
  source: string;
  campaignRef: string;
  amount: number;
  status: TierClaimStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    ownerId: string,
    source: string,
    campaignRef: string,
    amount: number,
    status: TierClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.ownerId = ownerId;
    this.source = source;
    this.campaignRef = campaignRef;
    this.amount = amount;
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

  canMoveTo(next: TierClaimStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TierClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tier claim"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): TierClaim {
    return new TierClaim(
      this.code,
      this.name,
      this.title,
      this.ownerId,
      this.source,
      this.campaignRef,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tier claim in status created. */
export function newTierClaim(code: string, name: string): TierClaim {
  return new TierClaim(code, name, "", "", "", "", 0, "created");
}
