import * as text from "../../../../kit/text.js";

/** Where a legacy frequency threshold is in its life cycle. */
export type LegacyFrequencyThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a legacy frequency threshold and its current status. */
export class LegacyFrequencyThreshold {
  code: string;
  title: string;
  channel: string;
  contactEmail: string;
  revision: number;
  conversionRate: number;
  variant: string;
  clicks: number;
  status: LegacyFrequencyThresholdStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    contactEmail: string,
    revision: number,
    conversionRate: number,
    variant: string,
    clicks: number,
    status: LegacyFrequencyThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.conversionRate = conversionRate;
    this.variant = variant;
    this.clicks = clicks;
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

  canMoveTo(next: LegacyFrequencyThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyFrequencyThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy frequency threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.revision + this.clicks) * 100) / 100;
  }

  copy(): LegacyFrequencyThreshold {
    return new LegacyFrequencyThreshold(
      this.code,
      this.title,
      this.channel,
      this.contactEmail,
      this.revision,
      this.conversionRate,
      this.variant,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy frequency threshold in status planned. */
export function newLegacyFrequencyThreshold(code: string, title: string): LegacyFrequencyThreshold {
  return new LegacyFrequencyThreshold(code, title, "", "", 0, 0, "", 0, "planned");
}
