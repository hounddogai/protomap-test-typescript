import * as text from "../../../../kit/text.js";

/** Where a step checkpoint is in its life cycle. */
export type StepCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A step checkpoint as the step team keeps it. */
export class StepCheckpoint {
  code: string;
  label: string;
  visible: boolean;
  revision: number;
  conversionRate: number;
  graceDays: number;
  utmSource: string;
  notes: string;
  cost: number;
  status: StepCheckpointStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    revision: number,
    conversionRate: number,
    graceDays: number,
    utmSource: string,
    notes: string,
    cost: number,
    status: StepCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.revision = revision;
    this.conversionRate = conversionRate;
    this.graceDays = graceDays;
    this.utmSource = utmSource;
    this.notes = notes;
    this.cost = cost;
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

  canMoveTo(next: StepCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
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

  moveTo(next: StepCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.cost * this.conversionRate * 100) / 100;
  }

  copy(): StepCheckpoint {
    return new StepCheckpoint(
      this.code,
      this.label,
      this.visible,
      this.revision,
      this.conversionRate,
      this.graceDays,
      this.utmSource,
      this.notes,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a step checkpoint in status created. */
export function newStepCheckpoint(code: string, label: string): StepCheckpoint {
  return new StepCheckpoint(code, label, false, 0, 0, 0, "", "", 0, "created");
}
