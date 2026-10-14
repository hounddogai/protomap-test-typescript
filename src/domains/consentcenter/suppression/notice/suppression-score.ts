import * as text from "../../../../kit/text.js";

/** Where a suppression score is in its life cycle. */
export type SuppressionScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a suppression score and its current status. */
export class SuppressionScore {
  code: string;
  label: string;
  quantity: number;
  source: string;
  description: string;
  status: SuppressionScoreStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    source: string,
    description: string,
    status: SuppressionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.source = source;
    this.description = description;
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

  canMoveTo(next: SuppressionScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SuppressionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): SuppressionScore {
    return new SuppressionScore(this.code, this.label, this.quantity, this.source, this.description, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a suppression score in status idle. */
export function newSuppressionScore(code: string, label: string): SuppressionScore {
  return new SuppressionScore(code, label, 0, "", "", "idle");
}
