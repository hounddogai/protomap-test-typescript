import * as text from "../../../../kit/text.js";

/** Where a default mention adjustment is in its life cycle. */
export type DefaultMentionAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default mention adjustment. Its code is unique within a tenant. */
export class DefaultMentionAdjustment {
  code: string;
  title: string;
  bid: number;
  margin: number;
  checksum: string;
  priority: number;
  quantity: number;
  status: DefaultMentionAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    margin: number,
    checksum: string,
    priority: number,
    quantity: number,
    status: DefaultMentionAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.margin = margin;
    this.checksum = checksum;
    this.priority = priority;
    this.quantity = quantity;
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

  canMoveTo(next: DefaultMentionAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultMentionAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default mention adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round((this.priority - this.quantity) * 100) / 100;
  }

  copy(): DefaultMentionAdjustment {
    return new DefaultMentionAdjustment(
      this.code,
      this.title,
      this.bid,
      this.margin,
      this.checksum,
      this.priority,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default mention adjustment in status open. */
export function newDefaultMentionAdjustment(code: string, title: string): DefaultMentionAdjustment {
  return new DefaultMentionAdjustment(code, title, 0, 0, "", 0, 0, "open");
}
