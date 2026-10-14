import * as text from "../../../../kit/text.js";

/** Where a queue policy is in its life cycle. */
export type QueuePolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One queue policy, with what the planners need to act on it. */
export class QueuePolicy {
  code: string;
  label: string;
  floorValue: number;
  batchSize: number;
  journeyId: string;
  status: QueuePolicyStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    batchSize: number,
    journeyId: string,
    status: QueuePolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.batchSize = batchSize;
    this.journeyId = journeyId;
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

  canMoveTo(next: QueuePolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: QueuePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round(this.floorValue * this.batchSize * 100) / 100;
  }

  copy(): QueuePolicy {
    return new QueuePolicy(this.code, this.label, this.floorValue, this.batchSize, this.journeyId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a queue policy in status proposed. */
export function newQueuePolicy(code: string, label: string): QueuePolicy {
  return new QueuePolicy(code, label, 0, 0, "", "proposed");
}
