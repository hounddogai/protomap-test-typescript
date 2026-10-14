import * as text from "../../../../kit/text.js";

/** Where a retention template is in its life cycle. */
export type RetentionTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A retention template as the retention team keeps it. */
export class RetentionTemplate {
  code: string;
  name: string;
  budget: number;
  sendAt: number;
  priority: number;
  category: string;
  externalRef: string;
  channel: string;
  discount: number;
  batchSize: number;
  currency: string;
  status: RetentionTemplateStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    sendAt: number,
    priority: number,
    category: string,
    externalRef: string,
    channel: string,
    discount: number,
    batchSize: number,
    currency: string,
    status: RetentionTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.sendAt = sendAt;
    this.priority = priority;
    this.category = category;
    this.externalRef = externalRef;
    this.channel = channel;
    this.discount = discount;
    this.batchSize = batchSize;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.discount + this.priority) * 100) / 100;
  }

  copy(): RetentionTemplate {
    return new RetentionTemplate(
      this.code,
      this.name,
      this.budget,
      this.sendAt,
      this.priority,
      this.category,
      this.externalRef,
      this.channel,
      this.discount,
      this.batchSize,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a retention template in status proposed. */
export function newRetentionTemplate(code: string, name: string): RetentionTemplate {
  return new RetentionTemplate(code, name, 0, 0, 0, "", "", "", 0, 0, "", "proposed");
}
