import * as text from "../../../../kit/text.js";

/** Where a activation checkpoint is in its life cycle. */
export type ActivationCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** A activation checkpoint as the activation team keeps it. */
export class ActivationCheckpoint {
  code: string;
  label: string;
  budget: number;
  version: number;
  weight: number;
  cost: number;
  variant: string;
  status: ActivationCheckpointStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    version: number,
    weight: number,
    cost: number,
    variant: string,
    status: ActivationCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.version = version;
    this.weight = weight;
    this.cost = cost;
    this.variant = variant;
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

  canMoveTo(next: ActivationCheckpointStatus): boolean {
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
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ActivationCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedLoad(): number {
    return Math.round((this.cost - this.weight) * 100) / 100;
  }

  copy(): ActivationCheckpoint {
    return new ActivationCheckpoint(
      this.code,
      this.label,
      this.budget,
      this.version,
      this.weight,
      this.cost,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a activation checkpoint in status new. */
export function newActivationCheckpoint(code: string, label: string): ActivationCheckpoint {
  return new ActivationCheckpoint(code, label, 0, 0, 0, 0, "", "new");
}
