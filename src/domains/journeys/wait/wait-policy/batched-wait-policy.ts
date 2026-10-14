/**
 * The batched wait policy records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched wait policy is in its life cycle. */
export type BatchedWaitPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One batched wait policy, with what the planners need to act on it. */
export class BatchedWaitPolicy {
  code: string;
  title: string;
  utmSource: string;
  summary: string;
  phone: string;
  label: string;
  approved: boolean;
  threshold: number;
  status: BatchedWaitPolicyStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    summary: string,
    phone: string,
    label: string,
    approved: boolean,
    threshold: number,
    status: BatchedWaitPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.summary = summary;
    this.phone = phone;
    this.label = label;
    this.approved = approved;
    this.threshold = threshold;
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

  canMoveTo(next: BatchedWaitPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedWaitPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched wait policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched wait policy"} ${this.code}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): BatchedWaitPolicy {
    return new BatchedWaitPolicy(
      this.code,
      this.title,
      this.utmSource,
      this.summary,
      this.phone,
      this.label,
      this.approved,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a batched wait policy in status idle. */
export function newBatchedWaitPolicy(code: string, title: string): BatchedWaitPolicy {
  return new BatchedWaitPolicy(code, title, "", "", "", "", false, 0, "idle");
}
