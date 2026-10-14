import * as text from "../../../../kit/text.js";

/** Where a adaptive reply threshold is in its life cycle. */
export type AdaptiveReplyThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive reply threshold. Its code is unique within a tenant. */
export class AdaptiveReplyThreshold {
  code: string;
  title: string;
  sendAt: number;
  label: string;
  version: number;
  currency: string;
  status: AdaptiveReplyThresholdStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    label: string,
    version: number,
    currency: string,
    status: AdaptiveReplyThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.label = label;
    this.version = version;
    this.currency = currency;
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

  canMoveTo(next: AdaptiveReplyThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveReplyThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reply threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.version - this.sendAt) * 100) / 100;
  }

  copy(): AdaptiveReplyThreshold {
    return new AdaptiveReplyThreshold(
      this.code,
      this.title,
      this.sendAt,
      this.label,
      this.version,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive reply threshold in status idle. */
export function newAdaptiveReplyThreshold(code: string, title: string): AdaptiveReplyThreshold {
  return new AdaptiveReplyThreshold(code, title, 0, "", 0, "", "idle");
}
