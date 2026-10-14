import * as text from "../../../../kit/text.js";

/** Where a primary step entry is in its life cycle. */
export type PrimaryStepEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One primary step entry, with what the planners need to act on it. */
export class PrimaryStepEntry {
  code: string;
  name: string;
  summary: string;
  openRate: number;
  frequencyCap: number;
  phone: string;
  timezone: string;
  amount: number;
  margin: number;
  batchSize: number;
  floorValue: number;
  status: PrimaryStepEntryStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    openRate: number,
    frequencyCap: number,
    phone: string,
    timezone: string,
    amount: number,
    margin: number,
    batchSize: number,
    floorValue: number,
    status: PrimaryStepEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.openRate = openRate;
    this.frequencyCap = frequencyCap;
    this.phone = phone;
    this.timezone = timezone;
    this.amount = amount;
    this.margin = margin;
    this.batchSize = batchSize;
    this.floorValue = floorValue;
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

  canMoveTo(next: PrimaryStepEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
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

  moveTo(next: PrimaryStepEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary step entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveTotal(): number {
    return Math.round((this.openRate + this.amount) * 100) / 100;
  }

  copy(): PrimaryStepEntry {
    return new PrimaryStepEntry(
      this.code,
      this.name,
      this.summary,
      this.openRate,
      this.frequencyCap,
      this.phone,
      this.timezone,
      this.amount,
      this.margin,
      this.batchSize,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary step entry in status proposed. */
export function newPrimaryStepEntry(code: string, name: string): PrimaryStepEntry {
  return new PrimaryStepEntry(code, name, "", 0, 0, "", "", 0, 0, 0, 0, "proposed");
}
