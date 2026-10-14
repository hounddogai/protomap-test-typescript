import * as text from "../../../../kit/text.js";

/** Where a batched domain template is in its life cycle. */
export type BatchedDomainTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched domain template. Its code is unique within a tenant. */
export class BatchedDomainTemplate {
  code: string;
  label: string;
  createdAt: number;
  frequencyCap: number;
  quantity: number;
  sendAt: number;
  status: BatchedDomainTemplateStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    frequencyCap: number,
    quantity: number,
    sendAt: number,
    status: BatchedDomainTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedDomainTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedDomainTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched domain template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.sendAt * this.createdAt * 100) / 100;
  }

  copy(): BatchedDomainTemplate {
    return new BatchedDomainTemplate(
      this.code,
      this.label,
      this.createdAt,
      this.frequencyCap,
      this.quantity,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched domain template in status idle. */
export function newBatchedDomainTemplate(code: string, label: string): BatchedDomainTemplate {
  return new BatchedDomainTemplate(code, label, 0, 0, 0, 0, "idle");
}
