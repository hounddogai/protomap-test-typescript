import * as text from "../../../../kit/text.js";

/** Where a pacing bundle is in its life cycle. */
export type PacingBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a pacing bundle and its current status. */
export class PacingBundle {
  code: string;
  label: string;
  ratio: number;
  priority: number;
  bid: number;
  batchSize: number;
  phone: string;
  maximum: number;
  createdAt: number;
  status: PacingBundleStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    priority: number,
    bid: number,
    batchSize: number,
    phone: string,
    maximum: number,
    createdAt: number,
    status: PacingBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.priority = priority;
    this.bid = bid;
    this.batchSize = batchSize;
    this.phone = phone;
    this.maximum = maximum;
    this.createdAt = createdAt;
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

  canMoveTo(next: PacingBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.priority - this.createdAt) * 100) / 100;
  }

  copy(): PacingBundle {
    return new PacingBundle(
      this.code,
      this.label,
      this.ratio,
      this.priority,
      this.bid,
      this.batchSize,
      this.phone,
      this.maximum,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pacing bundle in status idle. */
export function newPacingBundle(code: string, label: string): PacingBundle {
  return new PacingBundle(code, label, 0, 0, 0, 0, "", 0, 0, "idle");
}
