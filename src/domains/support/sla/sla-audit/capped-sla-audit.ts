/**
 * The capped sla audit records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped sla audit is in its life cycle. */
export type CappedSlaAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped sla audit as the sla team keeps it. */
export class CappedSlaAudit {
  code: string;
  label: string;
  contactEmail: string;
  summary: string;
  impressions: number;
  variant: string;
  country: string;
  ownerId: string;
  priority: number;
  visible: boolean;
  status: CappedSlaAuditStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    summary: string,
    impressions: number,
    variant: string,
    country: string,
    ownerId: string,
    priority: number,
    visible: boolean,
    status: CappedSlaAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.impressions = impressions;
    this.variant = variant;
    this.country = country;
    this.ownerId = ownerId;
    this.priority = priority;
    this.visible = visible;
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

  canMoveTo(next: CappedSlaAuditStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedSlaAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped sla audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped sla audit"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.priority * this.impressions * 100) / 100;
  }

  copy(): CappedSlaAudit {
    return new CappedSlaAudit(
      this.code,
      this.label,
      this.contactEmail,
      this.summary,
      this.impressions,
      this.variant,
      this.country,
      this.ownerId,
      this.priority,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a capped sla audit in status open. */
export function newCappedSlaAudit(code: string, label: string): CappedSlaAudit {
  return new CappedSlaAudit(code, label, "", "", 0, "", "", "", 0, false, "open");
}
