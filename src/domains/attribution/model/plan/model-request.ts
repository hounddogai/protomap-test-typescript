import * as text from "../../../../kit/text.js";

/** Where a model request is in its life cycle. */
export type ModelRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A model request as the model team keeps it. */
export class ModelRequest {
  code: string;
  label: string;
  threshold: number;
  amount: number;
  conversionRate: number;
  status: ModelRequestStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    amount: number,
    conversionRate: number,
    status: ModelRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.amount = amount;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: ModelRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ModelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.threshold - this.conversionRate) * 100) / 100;
  }

  copy(): ModelRequest {
    return new ModelRequest(this.code, this.label, this.threshold, this.amount, this.conversionRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a model request in status idle. */
export function newModelRequest(code: string, label: string): ModelRequest {
  return new ModelRequest(code, label, 0, 0, 0, "idle");
}
