/**
 * The tiered double opt in assignment records of consentcenter's double opt in work, and the rules, stores,
 * and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered double opt in assignment is in its life cycle. */
export type TieredDoubleOptInAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered double opt in assignment. Its code is unique within a tenant. */
export class TieredDoubleOptInAssignment {
  code: string;
  name: string;
  graceDays: number;
  label: string;
  phone: string;
  channel: string;
  status: TieredDoubleOptInAssignmentStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    label: string,
    phone: string,
    channel: string,
    status: TieredDoubleOptInAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.label = label;
    this.phone = phone;
    this.channel = channel;
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

  canMoveTo(next: TieredDoubleOptInAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TieredDoubleOptInAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered double opt in assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): TieredDoubleOptInAssignment {
    return new TieredDoubleOptInAssignment(
      this.code,
      this.name,
      this.graceDays,
      this.label,
      this.phone,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered double opt in assignment in status requested. */
export function newTieredDoubleOptInAssignment(code: string, name: string): TieredDoubleOptInAssignment {
  return new TieredDoubleOptInAssignment(code, name, 0, "", "", "", "requested");
}
