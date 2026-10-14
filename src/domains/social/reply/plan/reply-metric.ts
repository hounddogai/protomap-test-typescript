import * as text from "../../../../kit/text.js";

/** Where a reply metric is in its life cycle. */
export type ReplyMetricStatus = "created" | "validated" | "published" | "retired";

/** The record of a reply metric and its current status. */
export class ReplyMetric {
  code: string;
  label: string;
  retries: number;
  openRate: number;
  audienceId: string;
  priority: number;
  phone: string;
  clicks: number;
  campaignRef: string;
  notes: string;
  status: ReplyMetricStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    openRate: number,
    audienceId: string,
    priority: number,
    phone: string,
    clicks: number,
    campaignRef: string,
    notes: string,
    status: ReplyMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.openRate = openRate;
    this.audienceId = audienceId;
    this.priority = priority;
    this.phone = phone;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.notes = notes;
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

  canMoveTo(next: ReplyMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"reply metric"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.openRate - this.clicks) * 100) / 100;
  }

  copy(): ReplyMetric {
    return new ReplyMetric(
      this.code,
      this.label,
      this.retries,
      this.openRate,
      this.audienceId,
      this.priority,
      this.phone,
      this.clicks,
      this.campaignRef,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reply metric in status created. */
export function newReplyMetric(code: string, label: string): ReplyMetric {
  return new ReplyMetric(code, label, 0, 0, "", 0, "", 0, "", "", "created");
}
