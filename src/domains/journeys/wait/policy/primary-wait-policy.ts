/**
 * The primary wait policy records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary wait policy is in its life cycle. */
export type PrimaryWaitPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary wait policy as the wait team keeps it. */
export class PrimaryWaitPolicy {
  code: string;
  label: string;
  visible: boolean;
  score: number;
  summary: string;
  status: PrimaryWaitPolicyStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    score: number,
    summary: string,
    status: PrimaryWaitPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.score = score;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryWaitPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryWaitPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary wait policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary wait policy"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PrimaryWaitPolicy {
    return new PrimaryWaitPolicy(this.code, this.label, this.visible, this.score, this.summary, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary wait policy in status proposed. */
export function newPrimaryWaitPolicy(code: string, label: string): PrimaryWaitPolicy {
  return new PrimaryWaitPolicy(code, label, false, 0, "", "proposed");
}
