import * as text from "../../../../kit/text.js";

/** Where a tiered frequency notice is in its life cycle. */
export type TieredFrequencyNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered frequency notice. Its code is unique within a tenant. */
export class TieredFrequencyNotice {
  code: string;
  title: string;
  country: string;
  sendAt: number;
  minimum: number;
  updatedAt: number;
  openRate: number;
  approved: boolean;
  impressions: number;
  status: TieredFrequencyNoticeStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    sendAt: number,
    minimum: number,
    updatedAt: number,
    openRate: number,
    approved: boolean,
    impressions: number,
    status: TieredFrequencyNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.sendAt = sendAt;
    this.minimum = minimum;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
    this.approved = approved;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredFrequencyNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TieredFrequencyNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered frequency notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.impressions - this.sendAt) * 100) / 100;
  }

  copy(): TieredFrequencyNotice {
    return new TieredFrequencyNotice(
      this.code,
      this.title,
      this.country,
      this.sendAt,
      this.minimum,
      this.updatedAt,
      this.openRate,
      this.approved,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered frequency notice in status open. */
export function newTieredFrequencyNotice(code: string, title: string): TieredFrequencyNotice {
  return new TieredFrequencyNotice(code, title, "", 0, 0, 0, 0, false, 0, "open");
}
