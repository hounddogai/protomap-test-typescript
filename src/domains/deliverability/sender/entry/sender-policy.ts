import * as text from "../../../../kit/text.js";

/** Where a sender policy is in its life cycle. */
export type SenderPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a sender policy and its current status. */
export class SenderPolicy {
  code: string;
  label: string;
  revision: number;
  quantity: number;
  journeyId: string;
  segment: string;
  status: SenderPolicyStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    quantity: number,
    journeyId: string,
    segment: string,
    status: SenderPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.quantity = quantity;
    this.journeyId = journeyId;
    this.segment = segment;
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

  canMoveTo(next: SenderPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
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
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SenderPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round(this.quantity * this.revision * 100) / 100;
  }

  copy(): SenderPolicy {
    return new SenderPolicy(
      this.code,
      this.label,
      this.revision,
      this.quantity,
      this.journeyId,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a sender policy in status proposed. */
export function newSenderPolicy(code: string, label: string): SenderPolicy {
  return new SenderPolicy(code, label, 0, 0, "", "", "proposed");
}
