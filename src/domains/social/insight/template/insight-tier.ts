import * as text from "../../../../kit/text.js";

/** Where a insight tier is in its life cycle. */
export type InsightTierStatus = "created" | "validated" | "published" | "retired";

/** The record of a insight tier and its current status. */
export class InsightTier {
  code: string;
  title: string;
  score: number;
  durationMinutes: number;
  retries: number;
  active: boolean;
  variant: string;
  utmSource: string;
  discount: number;
  phone: string;
  windowDays: number;
  status: InsightTierStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    durationMinutes: number,
    retries: number,
    active: boolean,
    variant: string,
    utmSource: string,
    discount: number,
    phone: string,
    windowDays: number,
    status: InsightTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.durationMinutes = durationMinutes;
    this.retries = retries;
    this.active = active;
    this.variant = variant;
    this.utmSource = utmSource;
    this.discount = discount;
    this.phone = phone;
    this.windowDays = windowDays;
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

  canMoveTo(next: InsightTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: InsightTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round(this.retries * this.windowDays * 100) / 100;
  }

  copy(): InsightTier {
    return new InsightTier(
      this.code,
      this.title,
      this.score,
      this.durationMinutes,
      this.retries,
      this.active,
      this.variant,
      this.utmSource,
      this.discount,
      this.phone,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a insight tier in status created. */
export function newInsightTier(code: string, title: string): InsightTier {
  return new InsightTier(code, title, 0, 0, 0, false, "", "", 0, "", 0, "created");
}
