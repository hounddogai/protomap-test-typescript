import * as text from "../../../../kit/text.js";

/** Where a wait window is in its life cycle. */
export type WaitWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A wait window. Its code is unique within a tenant. */
export class WaitWindow {
  code: string;
  label: string;
  phone: string;
  frequencyCap: number;
  batchSize: number;
  bid: number;
  unit: string;
  score: number;
  status: WaitWindowStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    frequencyCap: number,
    batchSize: number,
    bid: number,
    unit: string,
    score: number,
    status: WaitWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.frequencyCap = frequencyCap;
    this.batchSize = batchSize;
    this.bid = bid;
    this.unit = unit;
    this.score = score;
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

  canMoveTo(next: WaitWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round(this.score * this.batchSize * 100) / 100;
  }

  copy(): WaitWindow {
    return new WaitWindow(
      this.code,
      this.label,
      this.phone,
      this.frequencyCap,
      this.batchSize,
      this.bid,
      this.unit,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a wait window in status idle. */
export function newWaitWindow(code: string, label: string): WaitWindow {
  return new WaitWindow(code, label, "", 0, 0, 0, "", 0, "idle");
}
