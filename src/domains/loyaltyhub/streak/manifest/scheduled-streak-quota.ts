import * as text from "../../../../kit/text.js";

/** Where a scheduled streak quota is in its life cycle. */
export type ScheduledStreakQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled streak quota. Its code is unique within a tenant. */
export class ScheduledStreakQuota {
  code: string;
  title: string;
  discount: number;
  tags: string[];
  campaignRef: string;
  status: ScheduledStreakQuotaStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    tags: string[],
    campaignRef: string,
    status: ScheduledStreakQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.tags = tags;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: ScheduledStreakQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledStreakQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled streak quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): ScheduledStreakQuota {
    return new ScheduledStreakQuota(this.code, this.title, this.discount, this.tags, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled streak quota in status draft. */
export function newScheduledStreakQuota(code: string, title: string): ScheduledStreakQuota {
  return new ScheduledStreakQuota(code, title, 0, [], "", "draft");
}
