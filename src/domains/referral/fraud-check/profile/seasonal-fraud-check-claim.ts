import * as text from "../../../../kit/text.js";

/** Where a seasonal fraud check claim is in its life cycle. */
export type SeasonalFraudCheckClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal fraud check claim. Its code is unique within a tenant. */
export class SeasonalFraudCheckClaim {
  code: string;
  title: string;
  category: string;
  ownerId: string;
  description: string;
  endsAt: number;
  unit: string;
  journeyId: string;
  channel: string;
  createdAt: number;
  sequence: number;
  status: SeasonalFraudCheckClaimStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    ownerId: string,
    description: string,
    endsAt: number,
    unit: string,
    journeyId: string,
    channel: string,
    createdAt: number,
    sequence: number,
    status: SeasonalFraudCheckClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.ownerId = ownerId;
    this.description = description;
    this.endsAt = endsAt;
    this.unit = unit;
    this.journeyId = journeyId;
    this.channel = channel;
    this.createdAt = createdAt;
    this.sequence = sequence;
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

  canMoveTo(next: SeasonalFraudCheckClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalFraudCheckClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal fraud check claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.sequence - this.createdAt) * 100) / 100;
  }

  copy(): SeasonalFraudCheckClaim {
    return new SeasonalFraudCheckClaim(
      this.code,
      this.title,
      this.category,
      this.ownerId,
      this.description,
      this.endsAt,
      this.unit,
      this.journeyId,
      this.channel,
      this.createdAt,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal fraud check claim in status draft. */
export function newSeasonalFraudCheckClaim(code: string, title: string): SeasonalFraudCheckClaim {
  return new SeasonalFraudCheckClaim(code, title, "", "", "", 0, "", "", "", 0, 0, "draft");
}
