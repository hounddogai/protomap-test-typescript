import * as text from "../../../../kit/text.js";

/** Where a escalation audit is in its life cycle. */
export type EscalationAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One escalation audit, with what the planners need to act on it. */
export class EscalationAudit {
  code: string;
  name: string;
  variant: string;
  campaignRef: string;
  channel: string;
  openRate: number;
  approved: boolean;
  budget: number;
  discount: number;
  title: string;
  status: EscalationAuditStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    campaignRef: string,
    channel: string,
    openRate: number,
    approved: boolean,
    budget: number,
    discount: number,
    title: string,
    status: EscalationAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.openRate = openRate;
    this.approved = approved;
    this.budget = budget;
    this.discount = discount;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: EscalationAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round(this.openRate * this.budget * 100) / 100;
  }

  copy(): EscalationAudit {
    return new EscalationAudit(
      this.code,
      this.name,
      this.variant,
      this.campaignRef,
      this.channel,
      this.openRate,
      this.approved,
      this.budget,
      this.discount,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a escalation audit in status draft. */
export function newEscalationAudit(code: string, name: string): EscalationAudit {
  return new EscalationAudit(code, name, "", "", "", 0, false, 0, 0, "", "draft");
}
