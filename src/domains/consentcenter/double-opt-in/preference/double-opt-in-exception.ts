import * as text from "../../../../kit/text.js";

/** Where a double opt in exception is in its life cycle. */
export type DoubleOptInExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a double opt in exception and its current status. */
export class DoubleOptInException {
  code: string;
  name: string;
  graceDays: number;
  active: boolean;
  endsAt: number;
  budget: number;
  status: DoubleOptInExceptionStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    active: boolean,
    endsAt: number,
    budget: number,
    status: DoubleOptInExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.active = active;
    this.endsAt = endsAt;
    this.budget = budget;
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

  canMoveTo(next: DoubleOptInExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: DoubleOptInExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"double opt in exception"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.endsAt * this.graceDays * 100) / 100;
  }

  copy(): DoubleOptInException {
    return new DoubleOptInException(
      this.code,
      this.name,
      this.graceDays,
      this.active,
      this.endsAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a double opt in exception in status new. */
export function newDoubleOptInException(code: string, name: string): DoubleOptInException {
  return new DoubleOptInException(code, name, 0, false, 0, 0, "new");
}
