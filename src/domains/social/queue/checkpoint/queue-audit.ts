import * as text from "../../../../kit/text.js";

/** Where a queue audit is in its life cycle. */
export type QueueAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A queue audit as the queue team keeps it. */
export class QueueAudit {
  code: string;
  name: string;
  quantity: number;
  externalRef: string;
  discount: number;
  region: string;
  currency: string;
  version: number;
  amount: number;
  status: QueueAuditStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    externalRef: string,
    discount: number,
    region: string,
    currency: string,
    version: number,
    amount: number,
    status: QueueAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.externalRef = externalRef;
    this.discount = discount;
    this.region = region;
    this.currency = currency;
    this.version = version;
    this.amount = amount;
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

  canMoveTo(next: QueueAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: QueueAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round(this.version * this.amount * 100) / 100;
  }

  copy(): QueueAudit {
    return new QueueAudit(
      this.code,
      this.name,
      this.quantity,
      this.externalRef,
      this.discount,
      this.region,
      this.currency,
      this.version,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a queue audit in status draft. */
export function newQueueAudit(code: string, name: string): QueueAudit {
  return new QueueAudit(code, name, 0, "", 0, "", "", 0, 0, "draft");
}
