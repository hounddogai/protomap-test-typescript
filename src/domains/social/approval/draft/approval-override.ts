import * as text from "../../../../kit/text.js";

/** Where a approval override is in its life cycle. */
export type ApprovalOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** A approval override. Its code is unique within a tenant. */
export class ApprovalOverride {
  code: string;
  title: string;
  weight: number;
  sendAt: number;
  batchSize: number;
  status: ApprovalOverrideStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    sendAt: number,
    batchSize: number,
    status: ApprovalOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
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

  canMoveTo(next: ApprovalOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ApprovalOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round(this.batchSize * this.sendAt * 100) / 100;
  }

  copy(): ApprovalOverride {
    return new ApprovalOverride(this.code, this.title, this.weight, this.sendAt, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a approval override in status new. */
export function newApprovalOverride(code: string, title: string): ApprovalOverride {
  return new ApprovalOverride(code, title, 0, 0, 0, "new");
}
