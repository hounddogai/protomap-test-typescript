import * as text from "../../../../kit/text.js";

/** Where a sender metric is in its life cycle. */
export type SenderMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One sender metric, with what the planners need to act on it. */
export class SenderMetric {
  code: string;
  title: string;
  archived: boolean;
  checksum: string;
  timezone: string;
  threshold: number;
  minimum: number;
  createdAt: number;
  budget: number;
  label: string;
  status: SenderMetricStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    checksum: string,
    timezone: string,
    threshold: number,
    minimum: number,
    createdAt: number,
    budget: number,
    label: string,
    status: SenderMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.checksum = checksum;
    this.timezone = timezone;
    this.threshold = threshold;
    this.minimum = minimum;
    this.createdAt = createdAt;
    this.budget = budget;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SenderMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round((this.threshold - this.budget) * 100) / 100;
  }

  copy(): SenderMetric {
    return new SenderMetric(
      this.code,
      this.title,
      this.archived,
      this.checksum,
      this.timezone,
      this.threshold,
      this.minimum,
      this.createdAt,
      this.budget,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sender metric in status draft. */
export function newSenderMetric(code: string, title: string): SenderMetric {
  return new SenderMetric(code, title, false, "", "", 0, 0, 0, 0, "", "draft");
}
