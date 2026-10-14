import * as text from "../../../../kit/text.js";

/** Where a batched enrollment template is in its life cycle. */
export type BatchedEnrollmentTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a batched enrollment template and its current status. */
export class BatchedEnrollmentTemplate {
  code: string;
  label: string;
  attributes: Map<string, string>;
  expiresAt: number;
  approved: boolean;
  status: BatchedEnrollmentTemplateStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    expiresAt: number,
    approved: boolean,
    status: BatchedEnrollmentTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.expiresAt = expiresAt;
    this.approved = approved;
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

  canMoveTo(next: BatchedEnrollmentTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedEnrollmentTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched enrollment template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): BatchedEnrollmentTemplate {
    return new BatchedEnrollmentTemplate(
      this.code,
      this.label,
      this.attributes,
      this.expiresAt,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched enrollment template in status requested. */
export function newBatchedEnrollmentTemplate(code: string, label: string): BatchedEnrollmentTemplate {
  return new BatchedEnrollmentTemplate(code, label, new Map<string, string>(), 0, false, "requested");
}
