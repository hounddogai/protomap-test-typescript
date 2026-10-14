import * as text from "../../../../kit/text.js";

/** Where a double opt in audit is in its life cycle. */
export type DoubleOptInAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** A double opt in audit as the double opt in team keeps it. */
export class DoubleOptInAudit {
  code: string;
  label: string;
  reviewer: string;
  openRate: number;
  visible: boolean;
  region: string;
  status: DoubleOptInAuditStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    openRate: number,
    visible: boolean,
    region: string,
    status: DoubleOptInAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.visible = visible;
    this.region = region;
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

  canMoveTo(next: DoubleOptInAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DoubleOptInAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): DoubleOptInAudit {
    return new DoubleOptInAudit(
      this.code,
      this.label,
      this.reviewer,
      this.openRate,
      this.visible,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a double opt in audit in status requested. */
export function newDoubleOptInAudit(code: string, label: string): DoubleOptInAudit {
  return new DoubleOptInAudit(code, label, "", 0, false, "", "requested");
}
