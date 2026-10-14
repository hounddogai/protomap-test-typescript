import * as text from "../../../../kit/text.js";

/** Where a badge metric is in its life cycle. */
export type BadgeMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** One badge metric, with what the planners need to act on it. */
export class BadgeMetric {
  code: string;
  label: string;
  openRate: number;
  tags: string[];
  durationMinutes: number;
  approved: boolean;
  discount: number;
  contactEmail: string;
  frequencyCap: number;
  status: BadgeMetricStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    tags: string[],
    durationMinutes: number,
    approved: boolean,
    discount: number,
    contactEmail: string,
    frequencyCap: number,
    status: BadgeMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.tags = tags;
    this.durationMinutes = durationMinutes;
    this.approved = approved;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeMetricStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"badge metric"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round((this.discount + this.openRate) * 100) / 100;
  }

  copy(): BadgeMetric {
    return new BadgeMetric(
      this.code,
      this.label,
      this.openRate,
      this.tags,
      this.durationMinutes,
      this.approved,
      this.discount,
      this.contactEmail,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a badge metric in status new. */
export function newBadgeMetric(code: string, label: string): BadgeMetric {
  return new BadgeMetric(code, label, 0, [], 0, false, 0, "", 0, "new");
}
