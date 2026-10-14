import * as text from "../../../../kit/text.js";

/** Where a fallback warmup entry is in its life cycle. */
export type FallbackWarmupEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fallback warmup entry and its current status. */
export class FallbackWarmupEntry {
  code: string;
  title: string;
  windowDays: number;
  approved: boolean;
  variant: string;
  campaignRef: string;
  channel: string;
  capacity: number;
  weight: number;
  cohort: string;
  description: string;
  status: FallbackWarmupEntryStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    approved: boolean,
    variant: string,
    campaignRef: string,
    channel: string,
    capacity: number,
    weight: number,
    cohort: string,
    description: string,
    status: FallbackWarmupEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.approved = approved;
    this.variant = variant;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.capacity = capacity;
    this.weight = weight;
    this.cohort = cohort;
    this.description = description;
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

  canMoveTo(next: FallbackWarmupEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackWarmupEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback warmup entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedExposure(): number {
    return Math.round(this.weight * this.capacity * 100) / 100;
  }

  copy(): FallbackWarmupEntry {
    return new FallbackWarmupEntry(
      this.code,
      this.title,
      this.windowDays,
      this.approved,
      this.variant,
      this.campaignRef,
      this.channel,
      this.capacity,
      this.weight,
      this.cohort,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback warmup entry in status proposed. */
export function newFallbackWarmupEntry(code: string, title: string): FallbackWarmupEntry {
  return new FallbackWarmupEntry(code, title, 0, false, "", "", "", 0, 0, "", "", "proposed");
}
