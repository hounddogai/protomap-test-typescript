import * as text from "../../../../kit/text.js";

/** Where a pending csat policy is in its life cycle. */
export type PendingCsatPolicyStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending csat policy. Its code is unique within a tenant. */
export class PendingCsatPolicy {
  code: string;
  name: string;
  version: number;
  label: string;
  journeyId: string;
  quantity: number;
  segment: string;
  bid: number;
  budget: number;
  archived: boolean;
  status: PendingCsatPolicyStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    label: string,
    journeyId: string,
    quantity: number,
    segment: string,
    bid: number,
    budget: number,
    archived: boolean,
    status: PendingCsatPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.label = label;
    this.journeyId = journeyId;
    this.quantity = quantity;
    this.segment = segment;
    this.bid = bid;
    this.budget = budget;
    this.archived = archived;
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

  canMoveTo(next: PendingCsatPolicyStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCsatPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending csat policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round((this.quantity + this.budget) * 100) / 100;
  }

  copy(): PendingCsatPolicy {
    return new PendingCsatPolicy(
      this.code,
      this.name,
      this.version,
      this.label,
      this.journeyId,
      this.quantity,
      this.segment,
      this.bid,
      this.budget,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending csat policy in status new. */
export function newPendingCsatPolicy(code: string, name: string): PendingCsatPolicy {
  return new PendingCsatPolicy(code, name, 0, "", "", 0, "", 0, 0, false, "new");
}
