import * as text from "../../../../kit/text.js";

/** Where a reply agreement is in its life cycle. */
export type ReplyAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One reply agreement, with what the planners need to act on it. */
export class ReplyAgreement {
  code: string;
  name: string;
  priority: number;
  createdAt: number;
  timezone: string;
  source: string;
  approved: boolean;
  status: ReplyAgreementStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    createdAt: number,
    timezone: string,
    source: string,
    approved: boolean,
    status: ReplyAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.createdAt = createdAt;
    this.timezone = timezone;
    this.source = source;
    this.approved = approved;
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

  canMoveTo(next: ReplyAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ReplyAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round((this.priority + this.createdAt) * 100) / 100;
  }

  copy(): ReplyAgreement {
    return new ReplyAgreement(
      this.code,
      this.name,
      this.priority,
      this.createdAt,
      this.timezone,
      this.source,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reply agreement in status open. */
export function newReplyAgreement(code: string, name: string): ReplyAgreement {
  return new ReplyAgreement(code, name, 0, 0, "", "", false, "open");
}
