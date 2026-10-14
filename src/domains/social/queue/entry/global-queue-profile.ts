import * as text from "../../../../kit/text.js";

/** Where a global queue profile is in its life cycle. */
export type GlobalQueueProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One global queue profile, with what the planners need to act on it. */
export class GlobalQueueProfile {
  code: string;
  label: string;
  revision: number;
  retries: number;
  ceiling: number;
  unit: string;
  graceDays: number;
  externalRef: string;
  status: GlobalQueueProfileStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    retries: number,
    ceiling: number,
    unit: string,
    graceDays: number,
    externalRef: string,
    status: GlobalQueueProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.retries = retries;
    this.ceiling = ceiling;
    this.unit = unit;
    this.graceDays = graceDays;
    this.externalRef = externalRef;
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

  canMoveTo(next: GlobalQueueProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalQueueProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global queue profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedExposure(): number {
    return Math.round((this.graceDays - this.retries) * 100) / 100;
  }

  copy(): GlobalQueueProfile {
    return new GlobalQueueProfile(
      this.code,
      this.label,
      this.revision,
      this.retries,
      this.ceiling,
      this.unit,
      this.graceDays,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global queue profile in status proposed. */
export function newGlobalQueueProfile(code: string, label: string): GlobalQueueProfile {
  return new GlobalQueueProfile(code, label, 0, 0, 0, "", 0, "", "proposed");
}
