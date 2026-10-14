import * as text from "../../../../kit/text.js";

/** Where a batched domain group is in its life cycle. */
export type BatchedDomainGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One batched domain group, with what the planners need to act on it. */
export class BatchedDomainGroup {
  code: string;
  name: string;
  country: string;
  channel: string;
  retries: number;
  locale: string;
  campaignRef: string;
  timezone: string;
  status: BatchedDomainGroupStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    channel: string,
    retries: number,
    locale: string,
    campaignRef: string,
    timezone: string,
    status: BatchedDomainGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.channel = channel;
    this.retries = retries;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.timezone = timezone;
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

  canMoveTo(next: BatchedDomainGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedDomainGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched domain group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched domain group"} ${this.code}`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): BatchedDomainGroup {
    return new BatchedDomainGroup(
      this.code,
      this.name,
      this.country,
      this.channel,
      this.retries,
      this.locale,
      this.campaignRef,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched domain group in status planned. */
export function newBatchedDomainGroup(code: string, name: string): BatchedDomainGroup {
  return new BatchedDomainGroup(code, name, "", "", 0, "", "", "", "planned");
}
