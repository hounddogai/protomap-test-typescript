import * as text from "../../../../kit/text.js";

/** Where a lenient retention request is in its life cycle. */
export type LenientRetentionRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One lenient retention request, with what the planners need to act on it. */
export class LenientRetentionRequest {
  code: string;
  label: string;
  segment: string;
  discount: number;
  country: string;
  status: LenientRetentionRequestStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    discount: number,
    country: string,
    status: LenientRetentionRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.discount = discount;
    this.country = country;
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

  canMoveTo(next: LenientRetentionRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
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

  moveTo(next: LenientRetentionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient retention request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): LenientRetentionRequest {
    return new LenientRetentionRequest(this.code, this.label, this.segment, this.discount, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient retention request in status idle. */
export function newLenientRetentionRequest(code: string, label: string): LenientRetentionRequest {
  return new LenientRetentionRequest(code, label, "", 0, "", "idle");
}
