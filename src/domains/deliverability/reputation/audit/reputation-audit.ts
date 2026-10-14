/**
 * The reputation audit records of deliverability's reputation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation audit is in its life cycle. */
export type ReputationAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a reputation audit and its current status. */
export class ReputationAudit {
  code: string;
  name: string;
  journeyId: string;
  ceiling: number;
  active: boolean;
  rate: number;
  campaignRef: string;
  ratio: number;
  sendAt: number;
  channel: string;
  status: ReputationAuditStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    ceiling: number,
    active: boolean,
    rate: number,
    campaignRef: string,
    ratio: number,
    sendAt: number,
    channel: string,
    status: ReputationAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.ceiling = ceiling;
    this.active = active;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.sendAt = sendAt;
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

  canMoveTo(next: ReputationAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reputation audit"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.ratio - this.sendAt) * 100) / 100;
  }

  copy(): ReputationAudit {
    return new ReputationAudit(
      this.code,
      this.name,
      this.journeyId,
      this.ceiling,
      this.active,
      this.rate,
      this.campaignRef,
      this.ratio,
      this.sendAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reputation audit in status requested. */
export function newReputationAudit(code: string, name: string): ReputationAudit {
  return new ReputationAudit(code, name, "", 0, false, 0, "", 0, 0, "", "requested");
}
