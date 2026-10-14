import * as text from "../../../../kit/text.js";

/** Where a capped mention variance is in its life cycle. */
export type CappedMentionVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One capped mention variance, with what the planners need to act on it. */
export class CappedMentionVariance {
  code: string;
  name: string;
  budget: number;
  quantity: number;
  checksum: string;
  openRate: number;
  locale: string;
  impressions: number;
  createdAt: number;
  journeyId: string;
  revision: number;
  status: CappedMentionVarianceStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    quantity: number,
    checksum: string,
    openRate: number,
    locale: string,
    impressions: number,
    createdAt: number,
    journeyId: string,
    revision: number,
    status: CappedMentionVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.quantity = quantity;
    this.checksum = checksum;
    this.openRate = openRate;
    this.locale = locale;
    this.impressions = impressions;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.revision = revision;
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

  canMoveTo(next: CappedMentionVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
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

  moveTo(next: CappedMentionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped mention variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.createdAt - this.impressions) * 100) / 100;
  }

  copy(): CappedMentionVariance {
    return new CappedMentionVariance(
      this.code,
      this.name,
      this.budget,
      this.quantity,
      this.checksum,
      this.openRate,
      this.locale,
      this.impressions,
      this.createdAt,
      this.journeyId,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped mention variance in status planned. */
export function newCappedMentionVariance(code: string, name: string): CappedMentionVariance {
  return new CappedMentionVariance(code, name, 0, 0, "", 0, "", 0, 0, "", 0, "planned");
}
