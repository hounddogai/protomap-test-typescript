/**
 * The global redemption group records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global redemption group is in its life cycle. */
export type GlobalRedemptionGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a global redemption group and its current status. */
export class GlobalRedemptionGroup {
  code: string;
  name: string;
  channel: string;
  maximum: number;
  retries: number;
  sendAt: number;
  startsAt: number;
  source: string;
  status: GlobalRedemptionGroupStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    maximum: number,
    retries: number,
    sendAt: number,
    startsAt: number,
    source: string,
    status: GlobalRedemptionGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.maximum = maximum;
    this.retries = retries;
    this.sendAt = sendAt;
    this.startsAt = startsAt;
    this.source = source;
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

  canMoveTo(next: GlobalRedemptionGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
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

  moveTo(next: GlobalRedemptionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global redemption group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.maximum + this.sendAt) * 100) / 100;
  }

  copy(): GlobalRedemptionGroup {
    return new GlobalRedemptionGroup(
      this.code,
      this.name,
      this.channel,
      this.maximum,
      this.retries,
      this.sendAt,
      this.startsAt,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global redemption group in status proposed. */
export function newGlobalRedemptionGroup(code: string, name: string): GlobalRedemptionGroup {
  return new GlobalRedemptionGroup(code, name, "", 0, 0, 0, 0, "", "proposed");
}
