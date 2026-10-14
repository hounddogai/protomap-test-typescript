import * as text from "../../../../kit/text.js";

/** Where a suppression batch is in its life cycle. */
export type SuppressionBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a suppression batch and its current status. */
export class SuppressionBatch {
  code: string;
  title: string;
  category: string;
  timezone: string;
  expiresAt: number;
  description: string;
  status: SuppressionBatchStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    timezone: string,
    expiresAt: number,
    description: string,
    status: SuppressionBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SuppressionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"suppression batch"} ${this.code}`;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): SuppressionBatch {
    return new SuppressionBatch(
      this.code,
      this.title,
      this.category,
      this.timezone,
      this.expiresAt,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a suppression batch in status requested. */
export function newSuppressionBatch(code: string, title: string): SuppressionBatch {
  return new SuppressionBatch(code, title, "", "", 0, "", "requested");
}
