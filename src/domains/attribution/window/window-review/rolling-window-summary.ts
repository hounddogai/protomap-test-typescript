import * as text from "../../../../kit/text.js";

/** Where a rolling window summary is in its life cycle. */
export type RollingWindowSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling window summary, with what the planners need to act on it. */
export class RollingWindowSummary {
  code: string;
  name: string;
  tags: string[];
  campaignRef: string;
  quantity: number;
  frequencyCap: number;
  region: string;
  cohort: string;
  contactEmail: string;
  status: RollingWindowSummaryStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    campaignRef: string,
    quantity: number,
    frequencyCap: number,
    region: string,
    cohort: string,
    contactEmail: string,
    status: RollingWindowSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.frequencyCap = frequencyCap;
    this.region = region;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: RollingWindowSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingWindowSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling window summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling window summary"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round((this.frequencyCap - this.quantity) * 100) / 100;
  }

  copy(): RollingWindowSummary {
    return new RollingWindowSummary(
      this.code,
      this.name,
      this.tags,
      this.campaignRef,
      this.quantity,
      this.frequencyCap,
      this.region,
      this.cohort,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling window summary in status planned. */
export function newRollingWindowSummary(code: string, name: string): RollingWindowSummary {
  return new RollingWindowSummary(code, name, [], "", 0, 0, "", "", "", "planned");
}
