import * as text from "../../../../kit/text.js";

/** Where a fallback subscription audit is in its life cycle. */
export type FallbackSubscriptionAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fallback subscription audit and its current status. */
export class FallbackSubscriptionAudit {
  code: string;
  label: string;
  ceiling: number;
  externalRef: string;
  region: string;
  archived: boolean;
  status: FallbackSubscriptionAuditStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    externalRef: string,
    region: string,
    archived: boolean,
    status: FallbackSubscriptionAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.externalRef = externalRef;
    this.region = region;
    this.archived = archived;
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

  canMoveTo(next: FallbackSubscriptionAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FallbackSubscriptionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback subscription audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback subscription audit"} ${this.code}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): FallbackSubscriptionAudit {
    return new FallbackSubscriptionAudit(
      this.code,
      this.label,
      this.ceiling,
      this.externalRef,
      this.region,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a fallback subscription audit in status proposed. */
export function newFallbackSubscriptionAudit(code: string, label: string): FallbackSubscriptionAudit {
  return new FallbackSubscriptionAudit(code, label, 0, "", "", false, "proposed");
}
