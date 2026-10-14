import * as text from "../../../../kit/text.js";

/** Where a activation ledger is in its life cycle. */
export type ActivationLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One activation ledger, with what the planners need to act on it. */
export class ActivationLedger {
  code: string;
  label: string;
  threshold: number;
  sendAt: number;
  ownerId: string;
  margin: number;
  status: ActivationLedgerStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    sendAt: number,
    ownerId: string,
    margin: number,
    status: ActivationLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.sendAt = sendAt;
    this.ownerId = ownerId;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round((this.sendAt + this.margin) * 100) / 100;
  }

  copy(): ActivationLedger {
    return new ActivationLedger(
      this.code,
      this.label,
      this.threshold,
      this.sendAt,
      this.ownerId,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a activation ledger in status planned. */
export function newActivationLedger(code: string, label: string): ActivationLedger {
  return new ActivationLedger(code, label, 0, 0, "", 0, "planned");
}
