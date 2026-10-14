import * as text from "../../../../kit/text.js";

/** Where a activation cycle is in its life cycle. */
export type ActivationCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A activation cycle. Its code is unique within a tenant. */
export class ActivationCycle {
  code: string;
  label: string;
  retries: number;
  margin: number;
  version: number;
  currency: string;
  status: ActivationCycleStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    margin: number,
    version: number,
    currency: string,
    status: ActivationCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.margin = margin;
    this.version = version;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"activation cycle"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.version * this.margin * 100) / 100;
  }

  copy(): ActivationCycle {
    return new ActivationCycle(
      this.code,
      this.label,
      this.retries,
      this.margin,
      this.version,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a activation cycle in status proposed. */
export function newActivationCycle(code: string, label: string): ActivationCycle {
  return new ActivationCycle(code, label, 0, 0, 0, "", "proposed");
}
