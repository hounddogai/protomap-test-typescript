import * as text from "../../../../kit/text.js";

/** Where a fallback credit segment is in its life cycle. */
export type FallbackCreditSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fallback credit segment, with what the planners need to act on it. */
export class FallbackCreditSegment {
  code: string;
  label: string;
  graceDays: number;
  sequence: number;
  frequencyCap: number;
  status: FallbackCreditSegmentStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    sequence: number,
    frequencyCap: number,
    status: FallbackCreditSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.sequence = sequence;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: FallbackCreditSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
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

  moveTo(next: FallbackCreditSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback credit segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback credit segment"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.frequencyCap + this.sequence) * 100) / 100;
  }

  copy(): FallbackCreditSegment {
    return new FallbackCreditSegment(
      this.code,
      this.label,
      this.graceDays,
      this.sequence,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback credit segment in status idle. */
export function newFallbackCreditSegment(code: string, label: string): FallbackCreditSegment {
  return new FallbackCreditSegment(code, label, 0, 0, 0, "idle");
}
