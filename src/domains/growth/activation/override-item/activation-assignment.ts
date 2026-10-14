import * as text from "../../../../kit/text.js";

/** Where a activation assignment is in its life cycle. */
export type ActivationAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a activation assignment and its current status. */
export class ActivationAssignment {
  code: string;
  name: string;
  contactEmail: string;
  title: string;
  timezone: string;
  amount: number;
  status: ActivationAssignmentStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    title: string,
    timezone: string,
    amount: number,
    status: ActivationAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.title = title;
    this.timezone = timezone;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ActivationAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"activation assignment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ActivationAssignment {
    return new ActivationAssignment(
      this.code,
      this.name,
      this.contactEmail,
      this.title,
      this.timezone,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a activation assignment in status requested. */
export function newActivationAssignment(code: string, name: string): ActivationAssignment {
  return new ActivationAssignment(code, name, "", "", "", 0, "requested");
}
