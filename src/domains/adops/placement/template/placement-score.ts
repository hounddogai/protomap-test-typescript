import * as text from "../../../../kit/text.js";

/** Where a placement score is in its life cycle. */
export type PlacementScoreStatus = "created" | "validated" | "published" | "retired";

/** A placement score as the placement team keeps it. */
export class PlacementScore {
  code: string;
  name: string;
  source: string;
  channel: string;
  graceDays: number;
  category: string;
  variant: string;
  approved: boolean;
  campaignRef: string;
  ownerId: string;
  ceiling: number;
  status: PlacementScoreStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    channel: string,
    graceDays: number,
    category: string,
    variant: string,
    approved: boolean,
    campaignRef: string,
    ownerId: string,
    ceiling: number,
    status: PlacementScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.channel = channel;
    this.graceDays = graceDays;
    this.category = category;
    this.variant = variant;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
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

  canMoveTo(next: PlacementScoreStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PlacementScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.ceiling - this.graceDays) * 100) / 100;
  }

  copy(): PlacementScore {
    return new PlacementScore(
      this.code,
      this.name,
      this.source,
      this.channel,
      this.graceDays,
      this.category,
      this.variant,
      this.approved,
      this.campaignRef,
      this.ownerId,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a placement score in status created. */
export function newPlacementScore(code: string, name: string): PlacementScore {
  return new PlacementScore(code, name, "", "", 0, "", "", false, "", "", 0, "created");
}
