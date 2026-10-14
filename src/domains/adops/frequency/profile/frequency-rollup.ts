import * as text from "../../../../kit/text.js";

/** Where a frequency rollup is in its life cycle. */
export type FrequencyRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A frequency rollup. Its code is unique within a tenant. */
export class FrequencyRollup {
  code: string;
  name: string;
  frequencyCap: number;
  visible: boolean;
  timezone: string;
  startsAt: number;
  notes: string;
  batchSize: number;
  limit: number;
  status: FrequencyRollupStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    visible: boolean,
    timezone: string,
    startsAt: number,
    notes: string,
    batchSize: number,
    limit: number,
    status: FrequencyRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.visible = visible;
    this.timezone = timezone;
    this.startsAt = startsAt;
    this.notes = notes;
    this.batchSize = batchSize;
    this.limit = limit;
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

  canMoveTo(next: FrequencyRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"frequency rollup"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.batchSize + this.limit) * 100) / 100;
  }

  copy(): FrequencyRollup {
    return new FrequencyRollup(
      this.code,
      this.name,
      this.frequencyCap,
      this.visible,
      this.timezone,
      this.startsAt,
      this.notes,
      this.batchSize,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a frequency rollup in status planned. */
export function newFrequencyRollup(code: string, name: string): FrequencyRollup {
  return new FrequencyRollup(code, name, 0, false, "", 0, "", 0, 0, "planned");
}
