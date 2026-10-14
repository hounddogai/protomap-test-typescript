import * as text from "../../../../kit/text.js";

/** Where a default proof batch is in its life cycle. */
export type DefaultProofBatchStatus = "created" | "validated" | "published" | "retired";

/** One default proof batch, with what the planners need to act on it. */
export class DefaultProofBatch {
  code: string;
  title: string;
  graceDays: number;
  active: boolean;
  weight: number;
  frequencyCap: number;
  timezone: string;
  visible: boolean;
  unit: string;
  priority: number;
  status: DefaultProofBatchStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    active: boolean,
    weight: number,
    frequencyCap: number,
    timezone: string,
    visible: boolean,
    unit: string,
    priority: number,
    status: DefaultProofBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.active = active;
    this.weight = weight;
    this.frequencyCap = frequencyCap;
    this.timezone = timezone;
    this.visible = visible;
    this.unit = unit;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultProofBatchStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultProofBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default proof batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default proof batch"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.frequencyCap - this.graceDays) * 100) / 100;
  }

  copy(): DefaultProofBatch {
    return new DefaultProofBatch(
      this.code,
      this.title,
      this.graceDays,
      this.active,
      this.weight,
      this.frequencyCap,
      this.timezone,
      this.visible,
      this.unit,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a default proof batch in status created. */
export function newDefaultProofBatch(code: string, title: string): DefaultProofBatch {
  return new DefaultProofBatch(code, title, 0, false, 0, 0, "", false, "", 0, "created");
}
