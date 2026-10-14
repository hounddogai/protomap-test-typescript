import * as text from "../../../../kit/text.js";

/** Where a badge quota is in its life cycle. */
export type BadgeQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A badge quota as the badge team keeps it. */
export class BadgeQuota {
  code: string;
  title: string;
  score: number;
  tags: string[];
  budget: number;
  bid: number;
  ownerId: string;
  segment: string;
  contactEmail: string;
  status: BadgeQuotaStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    tags: string[],
    budget: number,
    bid: number,
    ownerId: string,
    segment: string,
    contactEmail: string,
    status: BadgeQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.tags = tags;
    this.budget = budget;
    this.bid = bid;
    this.ownerId = ownerId;
    this.segment = segment;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: BadgeQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"badge quota"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.score - this.bid) * 100) / 100;
  }

  copy(): BadgeQuota {
    return new BadgeQuota(
      this.code,
      this.title,
      this.score,
      this.tags,
      this.budget,
      this.bid,
      this.ownerId,
      this.segment,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a badge quota in status new. */
export function newBadgeQuota(code: string, title: string): BadgeQuota {
  return new BadgeQuota(code, title, 0, [], 0, 0, "", "", "", "new");
}
