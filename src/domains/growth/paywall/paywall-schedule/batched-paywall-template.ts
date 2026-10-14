import * as text from "../../../../kit/text.js";

/** Where a batched paywall template is in its life cycle. */
export type BatchedPaywallTemplateStatus = "created" | "validated" | "published" | "retired";

/** A batched paywall template. Its code is unique within a tenant. */
export class BatchedPaywallTemplate {
  code: string;
  title: string;
  graceDays: number;
  expiresAt: number;
  createdAt: number;
  ratio: number;
  limit: number;
  audienceId: string;
  status: BatchedPaywallTemplateStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    expiresAt: number,
    createdAt: number,
    ratio: number,
    limit: number,
    audienceId: string,
    status: BatchedPaywallTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.ratio = ratio;
    this.limit = limit;
    this.audienceId = audienceId;
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

  canMoveTo(next: BatchedPaywallTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
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

  moveTo(next: BatchedPaywallTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched paywall template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.limit + this.ratio) * 100) / 100;
  }

  copy(): BatchedPaywallTemplate {
    return new BatchedPaywallTemplate(
      this.code,
      this.title,
      this.graceDays,
      this.expiresAt,
      this.createdAt,
      this.ratio,
      this.limit,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched paywall template in status created. */
export function newBatchedPaywallTemplate(code: string, title: string): BatchedPaywallTemplate {
  return new BatchedPaywallTemplate(code, title, 0, 0, 0, 0, 0, "", "created");
}
