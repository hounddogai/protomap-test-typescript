import * as text from "../../../../kit/text.js";

/** Where a seasonal subscription segment is in its life cycle. */
export type SeasonalSubscriptionSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A seasonal subscription segment. Its code is unique within a tenant. */
export class SeasonalSubscriptionSegment {
  code: string;
  name: string;
  description: string;
  createdAt: number;
  audienceId: string;
  floorValue: number;
  conversionRate: number;
  version: number;
  ceiling: number;
  sendAt: number;
  source: string;
  status: SeasonalSubscriptionSegmentStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    createdAt: number,
    audienceId: string,
    floorValue: number,
    conversionRate: number,
    version: number,
    ceiling: number,
    sendAt: number,
    source: string,
    status: SeasonalSubscriptionSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.version = version;
    this.ceiling = ceiling;
    this.sendAt = sendAt;
    this.source = source;
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

  canMoveTo(next: SeasonalSubscriptionSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SeasonalSubscriptionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal subscription segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.sendAt + this.createdAt) * 100) / 100;
  }

  copy(): SeasonalSubscriptionSegment {
    return new SeasonalSubscriptionSegment(
      this.code,
      this.name,
      this.description,
      this.createdAt,
      this.audienceId,
      this.floorValue,
      this.conversionRate,
      this.version,
      this.ceiling,
      this.sendAt,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal subscription segment in status requested. */
export function newSeasonalSubscriptionSegment(code: string, name: string): SeasonalSubscriptionSegment {
  return new SeasonalSubscriptionSegment(code, name, "", 0, "", 0, 0, 0, 0, 0, "", "requested");
}
