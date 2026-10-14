import * as text from "../../../../kit/text.js";

/** Where a manual sender score is in its life cycle. */
export type ManualSenderScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One manual sender score, with what the planners need to act on it. */
export class ManualSenderScore {
  code: string;
  label: string;
  approved: boolean;
  floorValue: number;
  retries: number;
  phone: string;
  status: ManualSenderScoreStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    floorValue: number,
    retries: number,
    phone: string,
    status: ManualSenderScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.floorValue = floorValue;
    this.retries = retries;
    this.phone = phone;
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

  canMoveTo(next: ManualSenderScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualSenderScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual sender score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round((this.floorValue - this.retries) * 100) / 100;
  }

  copy(): ManualSenderScore {
    return new ManualSenderScore(
      this.code,
      this.label,
      this.approved,
      this.floorValue,
      this.retries,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual sender score in status proposed. */
export function newManualSenderScore(code: string, label: string): ManualSenderScore {
  return new ManualSenderScore(code, label, false, 0, 0, "", "proposed");
}
