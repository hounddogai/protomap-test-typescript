import * as text from "../../../../kit/text.js";

/** Where a seasonal tier baseline is in its life cycle. */
export type SeasonalTierBaselineStatus = "created" | "validated" | "published" | "retired";

/** The record of a seasonal tier baseline and its current status. */
export class SeasonalTierBaseline {
  code: string;
  title: string;
  floorValue: number;
  discount: number;
  reviewer: string;
  updatedAt: number;
  expiresAt: number;
  name: string;
  externalRef: string;
  sequence: number;
  status: SeasonalTierBaselineStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    discount: number,
    reviewer: string,
    updatedAt: number,
    expiresAt: number,
    name: string,
    externalRef: string,
    sequence: number,
    status: SeasonalTierBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.discount = discount;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.expiresAt = expiresAt;
    this.name = name;
    this.externalRef = externalRef;
    this.sequence = sequence;
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

  canMoveTo(next: SeasonalTierBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalTierBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal tier baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round((this.expiresAt + this.updatedAt) * 100) / 100;
  }

  copy(): SeasonalTierBaseline {
    return new SeasonalTierBaseline(
      this.code,
      this.title,
      this.floorValue,
      this.discount,
      this.reviewer,
      this.updatedAt,
      this.expiresAt,
      this.name,
      this.externalRef,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal tier baseline in status created. */
export function newSeasonalTierBaseline(code: string, title: string): SeasonalTierBaseline {
  return new SeasonalTierBaseline(code, title, 0, 0, "", 0, 0, "", "", 0, "created");
}
