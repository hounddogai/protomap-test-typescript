import * as text from "../../../../kit/text.js";

/** Where a challenge mapping is in its life cycle. */
export type ChallengeMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A challenge mapping as the challenge team keeps it. */
export class ChallengeMapping {
  code: string;
  label: string;
  cost: number;
  currency: string;
  floorValue: number;
  ownerId: string;
  weight: number;
  source: string;
  reviewer: string;
  channel: string;
  discount: number;
  status: ChallengeMappingStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    currency: string,
    floorValue: number,
    ownerId: string,
    weight: number,
    source: string,
    reviewer: string,
    channel: string,
    discount: number,
    status: ChallengeMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.currency = currency;
    this.floorValue = floorValue;
    this.ownerId = ownerId;
    this.weight = weight;
    this.source = source;
    this.reviewer = reviewer;
    this.channel = channel;
    this.discount = discount;
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

  canMoveTo(next: ChallengeMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ChallengeMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.weight + this.discount) * 100) / 100;
  }

  copy(): ChallengeMapping {
    return new ChallengeMapping(
      this.code,
      this.label,
      this.cost,
      this.currency,
      this.floorValue,
      this.ownerId,
      this.weight,
      this.source,
      this.reviewer,
      this.channel,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a challenge mapping in status requested. */
export function newChallengeMapping(code: string, label: string): ChallengeMapping {
  return new ChallengeMapping(code, label, 0, "", 0, "", 0, "", "", "", 0, "requested");
}
