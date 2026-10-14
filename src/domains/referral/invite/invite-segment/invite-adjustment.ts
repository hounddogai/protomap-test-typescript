import * as text from "../../../../kit/text.js";

/** Where a invite adjustment is in its life cycle. */
export type InviteAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a invite adjustment and its current status. */
export class InviteAdjustment {
  code: string;
  name: string;
  title: string;
  sendAt: number;
  campaignRef: string;
  status: InviteAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    sendAt: number,
    campaignRef: string,
    status: InviteAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.sendAt = sendAt;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: InviteAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): InviteAdjustment {
    return new InviteAdjustment(this.code, this.name, this.title, this.sendAt, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a invite adjustment in status proposed. */
export function newInviteAdjustment(code: string, name: string): InviteAdjustment {
  return new InviteAdjustment(code, name, "", 0, "", "proposed");
}
