/**
 * The regional approval record records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional approval record is in its life cycle. */
export type RegionalApprovalRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One regional approval record, with what the planners need to act on it. */
export class RegionalApprovalRecord {
  code: string;
  title: string;
  audienceId: string;
  channel: string;
  region: string;
  currency: string;
  contactEmail: string;
  durationMinutes: number;
  version: number;
  status: RegionalApprovalRecordStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    channel: string,
    region: string,
    currency: string,
    contactEmail: string,
    durationMinutes: number,
    version: number,
    status: RegionalApprovalRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.channel = channel;
    this.region = region;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.durationMinutes = durationMinutes;
    this.version = version;
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

  canMoveTo(next: RegionalApprovalRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: RegionalApprovalRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional approval record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round((this.durationMinutes + this.version) * 100) / 100;
  }

  copy(): RegionalApprovalRecord {
    return new RegionalApprovalRecord(
      this.code,
      this.title,
      this.audienceId,
      this.channel,
      this.region,
      this.currency,
      this.contactEmail,
      this.durationMinutes,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional approval record in status proposed. */
export function newRegionalApprovalRecord(code: string, title: string): RegionalApprovalRecord {
  return new RegionalApprovalRecord(code, title, "", "", "", "", "", 0, 0, "proposed");
}
