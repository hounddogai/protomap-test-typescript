import * as text from "../../../../kit/text.js";

/** Where a seasonal proof claim is in its life cycle. */
export type SeasonalProofClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal proof claim as the proof team keeps it. */
export class SeasonalProofClaim {
  code: string;
  title: string;
  weight: number;
  ceiling: number;
  batchSize: number;
  startsAt: number;
  endsAt: number;
  ownerId: string;
  active: boolean;
  maximum: number;
  createdAt: number;
  status: SeasonalProofClaimStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    ceiling: number,
    batchSize: number,
    startsAt: number,
    endsAt: number,
    ownerId: string,
    active: boolean,
    maximum: number,
    createdAt: number,
    status: SeasonalProofClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.ceiling = ceiling;
    this.batchSize = batchSize;
    this.startsAt = startsAt;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.active = active;
    this.maximum = maximum;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalProofClaimStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalProofClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal proof claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netValue(): number {
    return Math.round((this.ceiling + this.maximum) * 100) / 100;
  }

  copy(): SeasonalProofClaim {
    return new SeasonalProofClaim(
      this.code,
      this.title,
      this.weight,
      this.ceiling,
      this.batchSize,
      this.startsAt,
      this.endsAt,
      this.ownerId,
      this.active,
      this.maximum,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal proof claim in status new. */
export function newSeasonalProofClaim(code: string, title: string): SeasonalProofClaim {
  return new SeasonalProofClaim(code, title, 0, 0, 0, 0, 0, "", false, 0, 0, "new");
}
