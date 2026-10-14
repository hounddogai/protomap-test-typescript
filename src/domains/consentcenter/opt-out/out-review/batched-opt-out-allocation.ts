import * as text from "../../../../kit/text.js";

/** Where a batched opt out allocation is in its life cycle. */
export type BatchedOptOutAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched opt out allocation, with what the planners need to act on it. */
export class BatchedOptOutAllocation {
  code: string;
  title: string;
  variant: string;
  limit: number;
  ceiling: number;
  contactEmail: string;
  sendAt: number;
  openRate: number;
  tags: string[];
  checksum: string;
  audienceId: string;
  status: BatchedOptOutAllocationStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    limit: number,
    ceiling: number,
    contactEmail: string,
    sendAt: number,
    openRate: number,
    tags: string[],
    checksum: string,
    audienceId: string,
    status: BatchedOptOutAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.limit = limit;
    this.ceiling = ceiling;
    this.contactEmail = contactEmail;
    this.sendAt = sendAt;
    this.openRate = openRate;
    this.tags = tags;
    this.checksum = checksum;
    this.audienceId = audienceId;
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

  canMoveTo(next: BatchedOptOutAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedOptOutAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched opt out allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched opt out allocation"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round(this.openRate * this.ceiling * 100) / 100;
  }

  copy(): BatchedOptOutAllocation {
    return new BatchedOptOutAllocation(
      this.code,
      this.title,
      this.variant,
      this.limit,
      this.ceiling,
      this.contactEmail,
      this.sendAt,
      this.openRate,
      this.tags,
      this.checksum,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched opt out allocation in status open. */
export function newBatchedOptOutAllocation(code: string, title: string): BatchedOptOutAllocation {
  return new BatchedOptOutAllocation(code, title, "", 0, 0, "", 0, 0, [], "", "", "open");
}
