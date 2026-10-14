import * as text from "../../../../kit/text.js";

/** Where a primary conversion target is in its life cycle. */
export type PrimaryConversionTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary conversion target as the conversion team keeps it. */
export class PrimaryConversionTarget {
  code: string;
  title: string;
  audienceId: string;
  active: boolean;
  createdAt: number;
  impressions: number;
  frequencyCap: number;
  windowDays: number;
  budget: number;
  variant: string;
  status: PrimaryConversionTargetStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    active: boolean,
    createdAt: number,
    impressions: number,
    frequencyCap: number,
    windowDays: number,
    budget: number,
    variant: string,
    status: PrimaryConversionTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.active = active;
    this.createdAt = createdAt;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.windowDays = windowDays;
    this.budget = budget;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryConversionTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryConversionTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary conversion target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.frequencyCap - this.budget) * 100) / 100;
  }

  copy(): PrimaryConversionTarget {
    return new PrimaryConversionTarget(
      this.code,
      this.title,
      this.audienceId,
      this.active,
      this.createdAt,
      this.impressions,
      this.frequencyCap,
      this.windowDays,
      this.budget,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary conversion target in status proposed. */
export function newPrimaryConversionTarget(code: string, title: string): PrimaryConversionTarget {
  return new PrimaryConversionTarget(code, title, "", false, 0, 0, 0, 0, 0, "", "proposed");
}
