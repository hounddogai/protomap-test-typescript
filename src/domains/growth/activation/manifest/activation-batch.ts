import * as text from "../../../../kit/text.js";

/** Where a activation batch is in its life cycle. */
export type ActivationBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** A activation batch. Its code is unique within a tenant. */
export class ActivationBatch {
  code: string;
  label: string;
  unit: string;
  priority: number;
  version: number;
  discount: number;
  status: ActivationBatchStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    priority: number,
    version: number,
    discount: number,
    status: ActivationBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.priority = priority;
    this.version = version;
    this.discount = discount;
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

  canMoveTo(next: ActivationBatchStatus): boolean {
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
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.version * this.priority * 100) / 100;
  }

  copy(): ActivationBatch {
    return new ActivationBatch(
      this.code,
      this.label,
      this.unit,
      this.priority,
      this.version,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a activation batch in status requested. */
export function newActivationBatch(code: string, label: string): ActivationBatch {
  return new ActivationBatch(code, label, "", 0, 0, 0, "requested");
}
