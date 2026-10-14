import * as text from "../../../../kit/text.js";

/** Where a paywall threshold is in its life cycle. */
export type PaywallThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a paywall threshold and its current status. */
export class PaywallThreshold {
  code: string;
  label: string;
  channel: string;
  threshold: number;
  externalRef: string;
  status: PaywallThresholdStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    threshold: number,
    externalRef: string,
    status: PaywallThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.threshold = threshold;
    this.externalRef = externalRef;
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

  canMoveTo(next: PaywallThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): PaywallThreshold {
    return new PaywallThreshold(this.code, this.label, this.channel, this.threshold, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a paywall threshold in status new. */
export function newPaywallThreshold(code: string, label: string): PaywallThreshold {
  return new PaywallThreshold(code, label, "", 0, "", "new");
}
