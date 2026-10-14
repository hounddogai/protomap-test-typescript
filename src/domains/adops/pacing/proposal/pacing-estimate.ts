import * as text from "../../../../kit/text.js";

/** Where a pacing estimate is in its life cycle. */
export type PacingEstimateStatus = "created" | "validated" | "published" | "retired";

/** One pacing estimate, with what the planners need to act on it. */
export class PacingEstimate {
  code: string;
  name: string;
  ownerId: string;
  expiresAt: number;
  region: string;
  impressions: number;
  channel: string;
  budget: number;
  status: PacingEstimateStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    expiresAt: number,
    region: string,
    impressions: number,
    channel: string,
    budget: number,
    status: PacingEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.expiresAt = expiresAt;
    this.region = region;
    this.impressions = impressions;
    this.channel = channel;
    this.budget = budget;
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

  canMoveTo(next: PacingEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.budget - this.impressions) * 100) / 100;
  }

  copy(): PacingEstimate {
    return new PacingEstimate(
      this.code,
      this.name,
      this.ownerId,
      this.expiresAt,
      this.region,
      this.impressions,
      this.channel,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pacing estimate in status created. */
export function newPacingEstimate(code: string, name: string): PacingEstimate {
  return new PacingEstimate(code, name, "", 0, "", 0, "", 0, "created");
}
