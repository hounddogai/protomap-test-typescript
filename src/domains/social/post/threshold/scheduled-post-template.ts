import * as text from "../../../../kit/text.js";

/** Where a scheduled post template is in its life cycle. */
export type ScheduledPostTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled post template as the post team keeps it. */
export class ScheduledPostTemplate {
  code: string;
  label: string;
  bid: number;
  segment: string;
  startsAt: number;
  threshold: number;
  createdAt: number;
  name: string;
  status: ScheduledPostTemplateStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    segment: string,
    startsAt: number,
    threshold: number,
    createdAt: number,
    name: string,
    status: ScheduledPostTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.segment = segment;
    this.startsAt = startsAt;
    this.threshold = threshold;
    this.createdAt = createdAt;
    this.name = name;
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

  canMoveTo(next: ScheduledPostTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
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

  moveTo(next: ScheduledPostTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled post template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round((this.createdAt - this.threshold) * 100) / 100;
  }

  copy(): ScheduledPostTemplate {
    return new ScheduledPostTemplate(
      this.code,
      this.label,
      this.bid,
      this.segment,
      this.startsAt,
      this.threshold,
      this.createdAt,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled post template in status draft. */
export function newScheduledPostTemplate(code: string, label: string): ScheduledPostTemplate {
  return new ScheduledPostTemplate(code, label, 0, "", 0, 0, 0, "", "draft");
}
