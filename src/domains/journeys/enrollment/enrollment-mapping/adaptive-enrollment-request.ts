import * as text from "../../../../kit/text.js";

/** Where a adaptive enrollment request is in its life cycle. */
export type AdaptiveEnrollmentRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One adaptive enrollment request, with what the planners need to act on it. */
export class AdaptiveEnrollmentRequest {
  code: string;
  name: string;
  graceDays: number;
  source: string;
  quantity: number;
  minimum: number;
  status: AdaptiveEnrollmentRequestStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    source: string,
    quantity: number,
    minimum: number,
    status: AdaptiveEnrollmentRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.source = source;
    this.quantity = quantity;
    this.minimum = minimum;
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

  canMoveTo(next: AdaptiveEnrollmentRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveEnrollmentRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive enrollment request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive enrollment request"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.graceDays + this.minimum) * 100) / 100;
  }

  copy(): AdaptiveEnrollmentRequest {
    return new AdaptiveEnrollmentRequest(
      this.code,
      this.name,
      this.graceDays,
      this.source,
      this.quantity,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive enrollment request in status idle. */
export function newAdaptiveEnrollmentRequest(code: string, name: string): AdaptiveEnrollmentRequest {
  return new AdaptiveEnrollmentRequest(code, name, 0, "", 0, 0, "idle");
}
