/**
 * The sender batch records of deliverability's sender work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender batch is in its life cycle. */
export type SenderBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A sender batch. Its code is unique within a tenant. */
export class SenderBatch {
  code: string;
  label: string;
  discount: number;
  phone: string;
  expiresAt: number;
  limit: number;
  createdAt: number;
  title: string;
  reviewer: string;
  locale: string;
  status: SenderBatchStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    phone: string,
    expiresAt: number,
    limit: number,
    createdAt: number,
    title: string,
    reviewer: string,
    locale: string,
    status: SenderBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.phone = phone;
    this.expiresAt = expiresAt;
    this.limit = limit;
    this.createdAt = createdAt;
    this.title = title;
    this.reviewer = reviewer;
    this.locale = locale;
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

  canMoveTo(next: SenderBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: SenderBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round((this.createdAt - this.discount) * 100) / 100;
  }

  copy(): SenderBatch {
    return new SenderBatch(
      this.code,
      this.label,
      this.discount,
      this.phone,
      this.expiresAt,
      this.limit,
      this.createdAt,
      this.title,
      this.reviewer,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a sender batch in status draft. */
export function newSenderBatch(code: string, label: string): SenderBatch {
  return new SenderBatch(code, label, 0, "", 0, 0, 0, "", "", "", "draft");
}
