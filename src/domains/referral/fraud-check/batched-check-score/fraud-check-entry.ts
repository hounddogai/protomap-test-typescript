import * as text from "../../../../kit/text.js";

/** Where a fraud check entry is in its life cycle. */
export type FraudCheckEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a fraud check entry and its current status. */
export class FraudCheckEntry {
  code: string;
  label: string;
  region: string;
  name: string;
  audienceId: string;
  amount: number;
  status: FraudCheckEntryStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    name: string,
    audienceId: string,
    amount: number,
    status: FraudCheckEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.name = name;
    this.audienceId = audienceId;
    this.amount = amount;
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

  canMoveTo(next: FraudCheckEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): FraudCheckEntry {
    return new FraudCheckEntry(
      this.code,
      this.label,
      this.region,
      this.name,
      this.audienceId,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a fraud check entry in status planned. */
export function newFraudCheckEntry(code: string, label: string): FraudCheckEntry {
  return new FraudCheckEntry(code, label, "", "", "", 0, "planned");
}
