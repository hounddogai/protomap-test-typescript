import * as text from "../../../../kit/text.js";

/** Where a fallback step override is in its life cycle. */
export type FallbackStepOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback step override. Its code is unique within a tenant. */
export class FallbackStepOverride {
  code: string;
  label: string;
  amount: number;
  timezone: string;
  endsAt: number;
  status: FallbackStepOverrideStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    timezone: string,
    endsAt: number,
    status: FallbackStepOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.timezone = timezone;
    this.endsAt = endsAt;
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

  canMoveTo(next: FallbackStepOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackStepOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback step override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.amount * this.endsAt * 100) / 100;
  }

  copy(): FallbackStepOverride {
    return new FallbackStepOverride(this.code, this.label, this.amount, this.timezone, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback step override in status new. */
export function newFallbackStepOverride(code: string, label: string): FallbackStepOverride {
  return new FallbackStepOverride(code, label, 0, "", 0, "new");
}
