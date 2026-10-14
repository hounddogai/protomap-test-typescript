import * as text from "../../../../kit/text.js";

/** Where a seasonal suppression request is in its life cycle. */
export type SeasonalSuppressionRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal suppression request as the suppression team keeps it. */
export class SeasonalSuppressionRequest {
  code: string;
  name: string;
  impressions: number;
  tags: string[];
  ownerId: string;
  sequence: number;
  status: SeasonalSuppressionRequestStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    tags: string[],
    ownerId: string,
    sequence: number,
    status: SeasonalSuppressionRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.tags = tags;
    this.ownerId = ownerId;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalSuppressionRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalSuppressionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal suppression request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  projectedValue(): number {
    return Math.round((this.sequence - this.impressions) * 100) / 100;
  }

  copy(): SeasonalSuppressionRequest {
    return new SeasonalSuppressionRequest(
      this.code,
      this.name,
      this.impressions,
      this.tags,
      this.ownerId,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal suppression request in status idle. */
export function newSeasonalSuppressionRequest(code: string, name: string): SeasonalSuppressionRequest {
  return new SeasonalSuppressionRequest(code, name, 0, [], "", 0, "idle");
}
