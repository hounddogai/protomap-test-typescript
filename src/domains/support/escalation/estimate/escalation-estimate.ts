/**
 * The escalation estimate records of support's escalation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation estimate is in its life cycle. */
export type EscalationEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** One escalation estimate, with what the planners need to act on it. */
export class EscalationEstimate {
  code: string;
  name: string;
  threshold: number;
  cost: number;
  contactEmail: string;
  priority: number;
  score: number;
  audienceId: string;
  category: string;
  campaignRef: string;
  phone: string;
  status: EscalationEstimateStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    cost: number,
    contactEmail: string,
    priority: number,
    score: number,
    audienceId: string,
    category: string,
    campaignRef: string,
    phone: string,
    status: EscalationEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.cost = cost;
    this.contactEmail = contactEmail;
    this.priority = priority;
    this.score = score;
    this.audienceId = audienceId;
    this.category = category;
    this.campaignRef = campaignRef;
    this.phone = phone;
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

  canMoveTo(next: EscalationEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
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

  moveTo(next: EscalationEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.threshold - this.score) * 100) / 100;
  }

  copy(): EscalationEstimate {
    return new EscalationEstimate(
      this.code,
      this.name,
      this.threshold,
      this.cost,
      this.contactEmail,
      this.priority,
      this.score,
      this.audienceId,
      this.category,
      this.campaignRef,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a escalation estimate in status requested. */
export function newEscalationEstimate(code: string, name: string): EscalationEstimate {
  return new EscalationEstimate(code, name, 0, 0, "", 0, 0, "", "", "", "", "requested");
}
