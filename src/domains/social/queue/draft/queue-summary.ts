import * as text from "../../../../kit/text.js";

/** Where a queue summary is in its life cycle. */
export type QueueSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A queue summary as the queue team keeps it. */
export class QueueSummary {
  code: string;
  label: string;
  reviewer: string;
  summary: string;
  locale: string;
  expiresAt: number;
  description: string;
  active: boolean;
  notes: string;
  clicks: number;
  status: QueueSummaryStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    summary: string,
    locale: string,
    expiresAt: number,
    description: string,
    active: boolean,
    notes: string,
    clicks: number,
    status: QueueSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.summary = summary;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.description = description;
    this.active = active;
    this.notes = notes;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: QueueSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round(this.expiresAt * this.clicks * 100) / 100;
  }

  copy(): QueueSummary {
    return new QueueSummary(
      this.code,
      this.label,
      this.reviewer,
      this.summary,
      this.locale,
      this.expiresAt,
      this.description,
      this.active,
      this.notes,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a queue summary in status idle. */
export function newQueueSummary(code: string, label: string): QueueSummary {
  return new QueueSummary(code, label, "", "", "", 0, "", false, "", 0, "idle");
}
