import * as text from "../../../../kit/text.js";

/** Where a queue rule is in its life cycle. */
export type QueueRuleStatus = "created" | "validated" | "published" | "retired";

/** A queue rule. Its code is unique within a tenant. */
export class QueueRule {
  code: string;
  title: string;
  contactEmail: string;
  retries: number;
  clicks: number;
  createdAt: number;
  source: string;
  status: QueueRuleStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    retries: number,
    clicks: number,
    createdAt: number,
    source: string,
    status: QueueRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.retries = retries;
    this.clicks = clicks;
    this.createdAt = createdAt;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueRuleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round((this.clicks + this.retries) * 100) / 100;
  }

  copy(): QueueRule {
    return new QueueRule(
      this.code,
      this.title,
      this.contactEmail,
      this.retries,
      this.clicks,
      this.createdAt,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a queue rule in status created. */
export function newQueueRule(code: string, title: string): QueueRule {
  return new QueueRule(code, title, "", 0, 0, 0, "", "created");
}
