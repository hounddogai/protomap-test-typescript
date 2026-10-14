import * as text from "../../../../kit/text.js";

/** Where a adaptive retention group is in its life cycle. */
export type AdaptiveRetentionGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a adaptive retention group and its current status. */
export class AdaptiveRetentionGroup {
  code: string;
  title: string;
  windowDays: number;
  tags: string[];
  amount: number;
  checksum: string;
  archived: boolean;
  segment: string;
  priority: number;
  status: AdaptiveRetentionGroupStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    tags: string[],
    amount: number,
    checksum: string,
    archived: boolean,
    segment: string,
    priority: number,
    status: AdaptiveRetentionGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.tags = tags;
    this.amount = amount;
    this.checksum = checksum;
    this.archived = archived;
    this.segment = segment;
    this.priority = priority;
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

  canMoveTo(next: AdaptiveRetentionGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: AdaptiveRetentionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive retention group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round(this.windowDays * this.priority * 100) / 100;
  }

  copy(): AdaptiveRetentionGroup {
    return new AdaptiveRetentionGroup(
      this.code,
      this.title,
      this.windowDays,
      this.tags,
      this.amount,
      this.checksum,
      this.archived,
      this.segment,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a adaptive retention group in status draft. */
export function newAdaptiveRetentionGroup(code: string, title: string): AdaptiveRetentionGroup {
  return new AdaptiveRetentionGroup(code, title, 0, [], 0, "", false, "", 0, "draft");
}
