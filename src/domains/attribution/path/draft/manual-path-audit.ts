import * as text from "../../../../kit/text.js";

/** Where a manual path audit is in its life cycle. */
export type ManualPathAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** One manual path audit, with what the planners need to act on it. */
export class ManualPathAudit {
  code: string;
  label: string;
  graceDays: number;
  conversionRate: number;
  floorValue: number;
  approved: boolean;
  status: ManualPathAuditStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    conversionRate: number,
    floorValue: number,
    approved: boolean,
    status: ManualPathAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.conversionRate = conversionRate;
    this.floorValue = floorValue;
    this.approved = approved;
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

  canMoveTo(next: ManualPathAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPathAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual path audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedLoad(): number {
    return Math.round((this.conversionRate - this.floorValue) * 100) / 100;
  }

  copy(): ManualPathAudit {
    return new ManualPathAudit(
      this.code,
      this.label,
      this.graceDays,
      this.conversionRate,
      this.floorValue,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual path audit in status requested. */
export function newManualPathAudit(code: string, label: string): ManualPathAudit {
  return new ManualPathAudit(code, label, 0, 0, 0, false, "requested");
}
