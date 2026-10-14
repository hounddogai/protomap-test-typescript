import * as text from "../../../../kit/text.js";

/** Where a frequency cycle is in its life cycle. */
export type FrequencyCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a frequency cycle and its current status. */
export class FrequencyCycle {
  code: string;
  label: string;
  endsAt: number;
  sequence: number;
  amount: number;
  maximum: number;
  limit: number;
  retries: number;
  status: FrequencyCycleStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    sequence: number,
    amount: number,
    maximum: number,
    limit: number,
    retries: number,
    status: FrequencyCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.sequence = sequence;
    this.amount = amount;
    this.maximum = maximum;
    this.limit = limit;
    this.retries = retries;
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

  canMoveTo(next: FrequencyCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.endsAt - this.amount) * 100) / 100;
  }

  copy(): FrequencyCycle {
    return new FrequencyCycle(
      this.code,
      this.label,
      this.endsAt,
      this.sequence,
      this.amount,
      this.maximum,
      this.limit,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a frequency cycle in status new. */
export function newFrequencyCycle(code: string, label: string): FrequencyCycle {
  return new FrequencyCycle(code, label, 0, 0, 0, 0, 0, 0, "new");
}
