/**
 * The invite bundle records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite bundle is in its life cycle. */
export type InviteBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a invite bundle and its current status. */
export class InviteBundle {
  code: string;
  label: string;
  unit: string;
  margin: number;
  quantity: number;
  status: InviteBundleStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    margin: number,
    quantity: number,
    status: InviteBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.margin = margin;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: InviteBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.quantity + this.margin) * 100) / 100;
  }

  copy(): InviteBundle {
    return new InviteBundle(this.code, this.label, this.unit, this.margin, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a invite bundle in status open. */
export function newInviteBundle(code: string, label: string): InviteBundle {
  return new InviteBundle(code, label, "", 0, 0, "open");
}
