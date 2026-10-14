import * as text from "../../../../kit/text.js";

/** Where a reward metric is in its life cycle. */
export type RewardMetricStatus = "created" | "validated" | "published" | "retired";

/** The record of a reward metric and its current status. */
export class RewardMetric {
  code: string;
  title: string;
  createdAt: number;
  audienceId: string;
  pinned: boolean;
  country: string;
  contactEmail: string;
  status: RewardMetricStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    audienceId: string,
    pinned: boolean,
    country: string,
    contactEmail: string,
    status: RewardMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.audienceId = audienceId;
    this.pinned = pinned;
    this.country = country;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: RewardMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reward metric"} ${this.code}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): RewardMetric {
    return new RewardMetric(
      this.code,
      this.title,
      this.createdAt,
      this.audienceId,
      this.pinned,
      this.country,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reward metric in status created. */
export function newRewardMetric(code: string, title: string): RewardMetric {
  return new RewardMetric(code, title, 0, "", false, "", "", "created");
}
