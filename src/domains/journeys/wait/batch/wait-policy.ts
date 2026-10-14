import * as text from "../../../../kit/text.js";

/** Where a wait policy is in its life cycle. */
export type WaitPolicyStatus = "new" | "queued" | "running" | "done" | "failed";

/** A wait policy. Its code is unique within a tenant. */
export class WaitPolicy {
  code: string;
  label: string;
  durationMinutes: number;
  quantity: number;
  source: string;
  status: WaitPolicyStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    quantity: number,
    source: string,
    status: WaitPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.quantity = quantity;
    this.source = source;
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

  canMoveTo(next: WaitPolicyStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round(this.quantity * this.durationMinutes * 100) / 100;
  }

  copy(): WaitPolicy {
    return new WaitPolicy(this.code, this.label, this.durationMinutes, this.quantity, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a wait policy in status new. */
export function newWaitPolicy(code: string, label: string): WaitPolicy {
  return new WaitPolicy(code, label, 0, 0, "", "new");
}
