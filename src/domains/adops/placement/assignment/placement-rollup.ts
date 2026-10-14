import * as text from "../../../../kit/text.js";

/** Where a placement rollup is in its life cycle. */
export type PlacementRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** One placement rollup, with what the planners need to act on it. */
export class PlacementRollup {
  code: string;
  name: string;
  tags: string[];
  startsAt: number;
  graceDays: number;
  channel: string;
  impressions: number;
  discount: number;
  status: PlacementRollupStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    startsAt: number,
    graceDays: number,
    channel: string,
    impressions: number,
    discount: number,
    status: PlacementRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.startsAt = startsAt;
    this.graceDays = graceDays;
    this.channel = channel;
    this.impressions = impressions;
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

  canMoveTo(next: PlacementRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PlacementRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.graceDays + this.impressions) * 100) / 100;
  }

  copy(): PlacementRollup {
    return new PlacementRollup(
      this.code,
      this.name,
      this.tags,
      this.startsAt,
      this.graceDays,
      this.channel,
      this.impressions,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a placement rollup in status requested. */
export function newPlacementRollup(code: string, name: string): PlacementRollup {
  return new PlacementRollup(code, name, [], 0, 0, "", 0, 0, "requested");
}
