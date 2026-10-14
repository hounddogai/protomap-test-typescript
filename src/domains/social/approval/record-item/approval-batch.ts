import * as text from "../../../../kit/text.js";

/** Where a approval batch is in its life cycle. */
export type ApprovalBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** A approval batch. Its code is unique within a tenant. */
export class ApprovalBatch {
  code: string;
  name: string;
  region: string;
  contactEmail: string;
  weight: number;
  ceiling: number;
  label: string;
  updatedAt: number;
  status: ApprovalBatchStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    contactEmail: string,
    weight: number,
    ceiling: number,
    label: string,
    updatedAt: number,
    status: ApprovalBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.ceiling = ceiling;
    this.label = label;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ApprovalBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.ceiling - this.updatedAt) * 100) / 100;
  }

  copy(): ApprovalBatch {
    return new ApprovalBatch(
      this.code,
      this.name,
      this.region,
      this.contactEmail,
      this.weight,
      this.ceiling,
      this.label,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a approval batch in status new. */
export function newApprovalBatch(code: string, name: string): ApprovalBatch {
  return new ApprovalBatch(code, name, "", "", 0, 0, "", 0, "new");
}
