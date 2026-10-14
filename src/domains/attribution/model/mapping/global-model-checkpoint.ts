import * as text from "../../../../kit/text.js";

/** Where a global model checkpoint is in its life cycle. */
export type GlobalModelCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a global model checkpoint and its current status. */
export class GlobalModelCheckpoint {
  code: string;
  name: string;
  budget: number;
  discount: number;
  sequence: number;
  maximum: number;
  variant: string;
  batchSize: number;
  title: string;
  threshold: number;
  active: boolean;
  status: GlobalModelCheckpointStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    discount: number,
    sequence: number,
    maximum: number,
    variant: string,
    batchSize: number,
    title: string,
    threshold: number,
    active: boolean,
    status: GlobalModelCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.discount = discount;
    this.sequence = sequence;
    this.maximum = maximum;
    this.variant = variant;
    this.batchSize = batchSize;
    this.title = title;
    this.threshold = threshold;
    this.active = active;
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

  canMoveTo(next: GlobalModelCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalModelCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global model checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round(this.threshold * this.maximum * 100) / 100;
  }

  copy(): GlobalModelCheckpoint {
    return new GlobalModelCheckpoint(
      this.code,
      this.name,
      this.budget,
      this.discount,
      this.sequence,
      this.maximum,
      this.variant,
      this.batchSize,
      this.title,
      this.threshold,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global model checkpoint in status planned. */
export function newGlobalModelCheckpoint(code: string, name: string): GlobalModelCheckpoint {
  return new GlobalModelCheckpoint(code, name, 0, 0, 0, 0, "", 0, "", 0, false, "planned");
}
