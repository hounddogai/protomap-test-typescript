import * as text from "../../../../kit/text.js";

/** Where a seasonal reward threshold is in its life cycle. */
export type SeasonalRewardThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal reward threshold as the reward team keeps it. */
export class SeasonalRewardThreshold {
  code: string;
  name: string;
  updatedAt: number;
  country: string;
  channel: string;
  limit: number;
  priority: number;
  utmSource: string;
  visible: boolean;
  status: SeasonalRewardThresholdStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    country: string,
    channel: string,
    limit: number,
    priority: number,
    utmSource: string,
    visible: boolean,
    status: SeasonalRewardThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.country = country;
    this.channel = channel;
    this.limit = limit;
    this.priority = priority;
    this.utmSource = utmSource;
    this.visible = visible;
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

  canMoveTo(next: SeasonalRewardThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalRewardThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reward threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netTotal(): number {
    return Math.round((this.limit - this.updatedAt) * 100) / 100;
  }

  copy(): SeasonalRewardThreshold {
    return new SeasonalRewardThreshold(
      this.code,
      this.name,
      this.updatedAt,
      this.country,
      this.channel,
      this.limit,
      this.priority,
      this.utmSource,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal reward threshold in status draft. */
export function newSeasonalRewardThreshold(code: string, name: string): SeasonalRewardThreshold {
  return new SeasonalRewardThreshold(code, name, 0, "", "", 0, 0, "", false, "draft");
}
