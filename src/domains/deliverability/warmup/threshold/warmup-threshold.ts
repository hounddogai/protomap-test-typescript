/**
 * The warmup threshold records of deliverability's warmup work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup threshold is in its life cycle. */
export type WarmupThresholdStatus = "created" | "validated" | "published" | "retired";

/** A warmup threshold. Its code is unique within a tenant. */
export class WarmupThreshold {
  code: string;
  title: string;
  unit: string;
  channel: string;
  batchSize: number;
  status: WarmupThresholdStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    channel: string,
    batchSize: number,
    status: WarmupThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.channel = channel;
    this.batchSize = batchSize;
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

  canMoveTo(next: WarmupThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): WarmupThreshold {
    return new WarmupThreshold(this.code, this.title, this.unit, this.channel, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a warmup threshold in status created. */
export function newWarmupThreshold(code: string, title: string): WarmupThreshold {
  return new WarmupThreshold(code, title, "", "", 0, "created");
}
