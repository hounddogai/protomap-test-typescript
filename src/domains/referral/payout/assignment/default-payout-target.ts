import * as text from "../../../../kit/text.js";

/** Where a default payout target is in its life cycle. */
export type DefaultPayoutTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default payout target. Its code is unique within a tenant. */
export class DefaultPayoutTarget {
  code: string;
  name: string;
  discount: number;
  segment: string;
  reviewer: string;
  tags: string[];
  quantity: number;
  openRate: number;
  status: DefaultPayoutTargetStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    segment: string,
    reviewer: string,
    tags: string[],
    quantity: number,
    openRate: number,
    status: DefaultPayoutTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.segment = segment;
    this.reviewer = reviewer;
    this.tags = tags;
    this.quantity = quantity;
    this.openRate = openRate;
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

  canMoveTo(next: DefaultPayoutTargetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DefaultPayoutTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default payout target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default payout target"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round((this.openRate - this.discount) * 100) / 100;
  }

  copy(): DefaultPayoutTarget {
    return new DefaultPayoutTarget(
      this.code,
      this.name,
      this.discount,
      this.segment,
      this.reviewer,
      this.tags,
      this.quantity,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a default payout target in status new. */
export function newDefaultPayoutTarget(code: string, name: string): DefaultPayoutTarget {
  return new DefaultPayoutTarget(code, name, 0, "", "", [], 0, 0, "new");
}
