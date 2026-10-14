import * as text from "../../../../kit/text.js";

/** Where a lenient wait policy is in its life cycle. */
export type LenientWaitPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient wait policy. Its code is unique within a tenant. */
export class LenientWaitPolicy {
  code: string;
  title: string;
  segment: string;
  sequence: number;
  notes: string;
  country: string;
  status: LenientWaitPolicyStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    sequence: number,
    notes: string,
    country: string,
    status: LenientWaitPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.sequence = sequence;
    this.notes = notes;
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

  canMoveTo(next: LenientWaitPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
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

  moveTo(next: LenientWaitPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient wait policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient wait policy"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): LenientWaitPolicy {
    return new LenientWaitPolicy(
      this.code,
      this.title,
      this.segment,
      this.sequence,
      this.notes,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient wait policy in status idle. */
export function newLenientWaitPolicy(code: string, title: string): LenientWaitPolicy {
  return new LenientWaitPolicy(code, title, "", 0, "", "", "idle");
}
