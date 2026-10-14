import * as text from "../../../../kit/text.js";

/** Where a scheduled domain metric is in its life cycle. */
export type ScheduledDomainMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled domain metric as the domain team keeps it. */
export class ScheduledDomainMetric {
  code: string;
  label: string;
  tags: string[];
  updatedAt: number;
  budget: number;
  country: string;
  startsAt: number;
  priority: number;
  title: string;
  status: ScheduledDomainMetricStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    updatedAt: number,
    budget: number,
    country: string,
    startsAt: number,
    priority: number,
    title: string,
    status: ScheduledDomainMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.updatedAt = updatedAt;
    this.budget = budget;
    this.country = country;
    this.startsAt = startsAt;
    this.priority = priority;
    this.title = title;
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

  canMoveTo(next: ScheduledDomainMetricStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledDomainMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled domain metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"scheduled domain metric"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round((this.startsAt - this.priority) * 100) / 100;
  }

  copy(): ScheduledDomainMetric {
    return new ScheduledDomainMetric(
      this.code,
      this.label,
      this.tags,
      this.updatedAt,
      this.budget,
      this.country,
      this.startsAt,
      this.priority,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled domain metric in status open. */
export function newScheduledDomainMetric(code: string, label: string): ScheduledDomainMetric {
  return new ScheduledDomainMetric(code, label, [], 0, 0, "", 0, 0, "", "open");
}
