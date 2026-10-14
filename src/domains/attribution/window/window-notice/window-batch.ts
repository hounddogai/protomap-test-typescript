import * as text from "../../../../kit/text.js";

/** Where a window batch is in its life cycle. */
export type WindowBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** One window batch, with what the planners need to act on it. */
export class WindowBatch {
  code: string;
  label: string;
  threshold: number;
  margin: number;
  windowDays: number;
  updatedAt: number;
  status: WindowBatchStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    margin: number,
    windowDays: number,
    updatedAt: number,
    status: WindowBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.margin = margin;
    this.windowDays = windowDays;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: WindowBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
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

  moveTo(next: WindowBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"window batch"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.windowDays - this.updatedAt) * 100) / 100;
  }

  copy(): WindowBatch {
    return new WindowBatch(
      this.code,
      this.label,
      this.threshold,
      this.margin,
      this.windowDays,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a window batch in status requested. */
export function newWindowBatch(code: string, label: string): WindowBatch {
  return new WindowBatch(code, label, 0, 0, 0, 0, "requested");
}
