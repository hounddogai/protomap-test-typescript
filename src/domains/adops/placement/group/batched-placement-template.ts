import * as text from "../../../../kit/text.js";

/** Where a batched placement template is in its life cycle. */
export type BatchedPlacementTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a batched placement template and its current status. */
export class BatchedPlacementTemplate {
  code: string;
  label: string;
  phone: string;
  updatedAt: number;
  discount: number;
  status: BatchedPlacementTemplateStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    updatedAt: number,
    discount: number,
    status: BatchedPlacementTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.updatedAt = updatedAt;
    this.discount = discount;
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

  canMoveTo(next: BatchedPlacementTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPlacementTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched placement template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"batched placement template"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.discount * this.updatedAt * 100) / 100;
  }

  copy(): BatchedPlacementTemplate {
    return new BatchedPlacementTemplate(this.code, this.label, this.phone, this.updatedAt, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched placement template in status new. */
export function newBatchedPlacementTemplate(code: string, label: string): BatchedPlacementTemplate {
  return new BatchedPlacementTemplate(code, label, "", 0, 0, "new");
}
