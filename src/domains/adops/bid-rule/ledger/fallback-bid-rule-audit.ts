import * as text from "../../../../kit/text.js";

/** Where a fallback bid rule audit is in its life cycle. */
export type FallbackBidRuleAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback bid rule audit. Its code is unique within a tenant. */
export class FallbackBidRuleAudit {
  code: string;
  label: string;
  country: string;
  ownerId: string;
  campaignRef: string;
  minimum: number;
  notes: string;
  status: FallbackBidRuleAuditStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    ownerId: string,
    campaignRef: string,
    minimum: number,
    notes: string,
    status: FallbackBidRuleAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.ownerId = ownerId;
    this.campaignRef = campaignRef;
    this.minimum = minimum;
    this.notes = notes;
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

  canMoveTo(next: FallbackBidRuleAuditStatus): boolean {
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

  moveTo(next: FallbackBidRuleAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bid rule audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback bid rule audit"} ${this.code}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): FallbackBidRuleAudit {
    return new FallbackBidRuleAudit(
      this.code,
      this.label,
      this.country,
      this.ownerId,
      this.campaignRef,
      this.minimum,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback bid rule audit in status proposed. */
export function newFallbackBidRuleAudit(code: string, label: string): FallbackBidRuleAudit {
  return new FallbackBidRuleAudit(code, label, "", "", "", 0, "", "proposed");
}
