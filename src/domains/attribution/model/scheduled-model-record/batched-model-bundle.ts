import * as text from "../../../../kit/text.js";

/** Where a batched model bundle is in its life cycle. */
export type BatchedModelBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a batched model bundle and its current status. */
export class BatchedModelBundle {
  code: string;
  label: string;
  windowDays: number;
  channel: string;
  priority: number;
  utmSource: string;
  sendAt: number;
  timezone: string;
  budget: number;
  status: BatchedModelBundleStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    channel: string,
    priority: number,
    utmSource: string,
    sendAt: number,
    timezone: string,
    budget: number,
    status: BatchedModelBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.channel = channel;
    this.priority = priority;
    this.utmSource = utmSource;
    this.sendAt = sendAt;
    this.timezone = timezone;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedModelBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedModelBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched model bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round(this.sendAt * this.budget * 100) / 100;
  }

  copy(): BatchedModelBundle {
    return new BatchedModelBundle(
      this.code,
      this.label,
      this.windowDays,
      this.channel,
      this.priority,
      this.utmSource,
      this.sendAt,
      this.timezone,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched model bundle in status requested. */
export function newBatchedModelBundle(code: string, label: string): BatchedModelBundle {
  return new BatchedModelBundle(code, label, 0, "", 0, "", 0, "", 0, "requested");
}
