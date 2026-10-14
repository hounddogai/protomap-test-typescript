import * as text from "../../../../kit/text.js";

/** Where a retention schedule is in its life cycle. */
export type RetentionScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A retention schedule as the retention team keeps it. */
export class RetentionSchedule {
  code: string;
  label: string;
  expiresAt: number;
  summary: string;
  tags: string[];
  locale: string;
  cost: number;
  segment: string;
  utmSource: string;
  attempts: number;
  budget: number;
  status: RetentionScheduleStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    summary: string,
    tags: string[],
    locale: string,
    cost: number,
    segment: string,
    utmSource: string,
    attempts: number,
    budget: number,
    status: RetentionScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.summary = summary;
    this.tags = tags;
    this.locale = locale;
    this.cost = cost;
    this.segment = segment;
    this.utmSource = utmSource;
    this.attempts = attempts;
    this.budget = budget;
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

  canMoveTo(next: RetentionScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RetentionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round(this.attempts * this.cost * 100) / 100;
  }

  copy(): RetentionSchedule {
    return new RetentionSchedule(
      this.code,
      this.label,
      this.expiresAt,
      this.summary,
      this.tags,
      this.locale,
      this.cost,
      this.segment,
      this.utmSource,
      this.attempts,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a retention schedule in status idle. */
export function newRetentionSchedule(code: string, label: string): RetentionSchedule {
  return new RetentionSchedule(code, label, 0, "", [], "", 0, "", "", 0, 0, "idle");
}
