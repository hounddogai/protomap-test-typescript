import * as text from "../../../../kit/text.js";

/** Where a primary invite assignment is in its life cycle. */
export type PrimaryInviteAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary invite assignment. Its code is unique within a tenant. */
export class PrimaryInviteAssignment {
  code: string;
  label: string;
  variant: string;
  maximum: number;
  ratio: number;
  channel: string;
  rate: number;
  sendAt: number;
  status: PrimaryInviteAssignmentStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    maximum: number,
    ratio: number,
    channel: string,
    rate: number,
    sendAt: number,
    status: PrimaryInviteAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.maximum = maximum;
    this.ratio = ratio;
    this.channel = channel;
    this.rate = rate;
    this.sendAt = sendAt;
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

  canMoveTo(next: PrimaryInviteAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
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

  moveTo(next: PrimaryInviteAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary invite assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.maximum * this.sendAt * 100) / 100;
  }

  copy(): PrimaryInviteAssignment {
    return new PrimaryInviteAssignment(
      this.code,
      this.label,
      this.variant,
      this.maximum,
      this.ratio,
      this.channel,
      this.rate,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary invite assignment in status proposed. */
export function newPrimaryInviteAssignment(code: string, label: string): PrimaryInviteAssignment {
  return new PrimaryInviteAssignment(code, label, "", 0, 0, "", 0, 0, "proposed");
}
