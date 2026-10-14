import * as text from "../../../../kit/text.js";

/** Where a reward forecast is in its life cycle. */
export type RewardForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reward forecast. Its code is unique within a tenant. */
export class RewardForecast {
  code: string;
  title: string;
  revision: number;
  journeyId: string;
  updatedAt: number;
  description: string;
  region: string;
  phone: string;
  status: RewardForecastStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    journeyId: string,
    updatedAt: number,
    description: string,
    region: string,
    phone: string,
    status: RewardForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.description = description;
    this.region = region;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.revision + this.updatedAt) * 100) / 100;
  }

  copy(): RewardForecast {
    return new RewardForecast(
      this.code,
      this.title,
      this.revision,
      this.journeyId,
      this.updatedAt,
      this.description,
      this.region,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reward forecast in status planned. */
export function newRewardForecast(code: string, title: string): RewardForecast {
  return new RewardForecast(code, title, 0, "", 0, "", "", "", "planned");
}
