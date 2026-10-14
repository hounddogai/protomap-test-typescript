import * as text from "../../../../kit/text.js";

/** Where a reply audit is in its life cycle. */
export type ReplyAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a reply audit and its current status. */
export class ReplyAudit {
  code: string;
  title: string;
  weight: number;
  discount: number;
  contactEmail: string;
  status: ReplyAuditStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    discount: number,
    contactEmail: string,
    status: ReplyAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.discount = discount;
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

  canMoveTo(next: ReplyAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
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
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ReplyAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reply audit"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.weight + this.discount) * 100) / 100;
  }

  copy(): ReplyAudit {
    return new ReplyAudit(this.code, this.title, this.weight, this.discount, this.contactEmail, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reply audit in status planned. */
export function newReplyAudit(code: string, title: string): ReplyAudit {
  return new ReplyAudit(code, title, 0, 0, "", "planned");
}
