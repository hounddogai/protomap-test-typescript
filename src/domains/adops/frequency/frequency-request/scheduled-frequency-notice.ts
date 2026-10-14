import * as text from "../../../../kit/text.js";

/** Where a scheduled frequency notice is in its life cycle. */
export type ScheduledFrequencyNoticeStatus = "created" | "validated" | "published" | "retired";

/** One scheduled frequency notice, with what the planners need to act on it. */
export class ScheduledFrequencyNotice {
  code: string;
  label: string;
  currency: string;
  source: string;
  impressions: number;
  notes: string;
  expiresAt: number;
  summary: string;
  status: ScheduledFrequencyNoticeStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    source: string,
    impressions: number,
    notes: string,
    expiresAt: number,
    summary: string,
    status: ScheduledFrequencyNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.source = source;
    this.impressions = impressions;
    this.notes = notes;
    this.expiresAt = expiresAt;
    this.summary = summary;
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

  canMoveTo(next: ScheduledFrequencyNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledFrequencyNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled frequency notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedLoad(): number {
    return Math.round((this.impressions + this.expiresAt) * 100) / 100;
  }

  copy(): ScheduledFrequencyNotice {
    return new ScheduledFrequencyNotice(
      this.code,
      this.label,
      this.currency,
      this.source,
      this.impressions,
      this.notes,
      this.expiresAt,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled frequency notice in status created. */
export function newScheduledFrequencyNotice(code: string, label: string): ScheduledFrequencyNotice {
  return new ScheduledFrequencyNotice(code, label, "", "", 0, "", 0, "", "created");
}
