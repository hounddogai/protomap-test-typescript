/**
 * The approval request records of social's approval work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval request is in its life cycle. */
export type ApprovalRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A approval request as the approval team keeps it. */
export class ApprovalRequest {
  code: string;
  name: string;
  journeyId: string;
  variant: string;
  region: string;
  maximum: number;
  status: ApprovalRequestStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    variant: string,
    region: string,
    maximum: number,
    status: ApprovalRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.variant = variant;
    this.region = region;
    this.maximum = maximum;
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

  canMoveTo(next: ApprovalRequestStatus): boolean {
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

  moveTo(next: ApprovalRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"approval request"} ${this.code}`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): ApprovalRequest {
    return new ApprovalRequest(
      this.code,
      this.name,
      this.journeyId,
      this.variant,
      this.region,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a approval request in status proposed. */
export function newApprovalRequest(code: string, name: string): ApprovalRequest {
  return new ApprovalRequest(code, name, "", "", "", 0, "proposed");
}
