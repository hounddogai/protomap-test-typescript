/**
 * The reputation digest records of deliverability's reputation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation digest is in its life cycle. */
export type ReputationDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reputation digest. Its code is unique within a tenant. */
export class ReputationDigest {
  code: string;
  label: string;
  discount: number;
  minimum: number;
  audienceId: string;
  status: ReputationDigestStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    minimum: number,
    audienceId: string,
    status: ReputationDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.minimum = minimum;
    this.audienceId = audienceId;
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

  canMoveTo(next: ReputationDigestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ReputationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"reputation digest"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.discount - this.minimum) * 100) / 100;
  }

  copy(): ReputationDigest {
    return new ReputationDigest(this.code, this.label, this.discount, this.minimum, this.audienceId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation digest in status new. */
export function newReputationDigest(code: string, label: string): ReputationDigest {
  return new ReputationDigest(code, label, 0, 0, "", "new");
}
