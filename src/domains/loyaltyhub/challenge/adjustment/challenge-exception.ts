import * as text from "../../../../kit/text.js";

/** Where a challenge exception is in its life cycle. */
export type ChallengeExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A challenge exception as the challenge team keeps it. */
export class ChallengeException {
  code: string;
  label: string;
  phone: string;
  approved: boolean;
  createdAt: number;
  status: ChallengeExceptionStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    approved: boolean,
    createdAt: number,
    status: ChallengeExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.approved = approved;
    this.createdAt = createdAt;
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

  canMoveTo(next: ChallengeExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
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

  moveTo(next: ChallengeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): ChallengeException {
    return new ChallengeException(this.code, this.label, this.phone, this.approved, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a challenge exception in status proposed. */
export function newChallengeException(code: string, label: string): ChallengeException {
  return new ChallengeException(code, label, "", false, 0, "proposed");
}
