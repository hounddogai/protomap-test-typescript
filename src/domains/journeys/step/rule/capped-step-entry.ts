import * as text from "../../../../kit/text.js";

/** Where a capped step entry is in its life cycle. */
export type CappedStepEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped step entry. Its code is unique within a tenant. */
export class CappedStepEntry {
  code: string;
  label: string;
  contactEmail: string;
  cohort: string;
  journeyId: string;
  quantity: number;
  status: CappedStepEntryStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    cohort: string,
    journeyId: string,
    quantity: number,
    status: CappedStepEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.quantity = quantity;
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

  canMoveTo(next: CappedStepEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedStepEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped step entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): CappedStepEntry {
    return new CappedStepEntry(
      this.code,
      this.label,
      this.contactEmail,
      this.cohort,
      this.journeyId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped step entry in status idle. */
export function newCappedStepEntry(code: string, label: string): CappedStepEntry {
  return new CappedStepEntry(code, label, "", "", "", 0, "idle");
}
