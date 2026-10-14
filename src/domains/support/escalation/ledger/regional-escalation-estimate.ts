import * as text from "../../../../kit/text.js";

/** Where a regional escalation estimate is in its life cycle. */
export type RegionalEscalationEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional escalation estimate as the escalation team keeps it. */
export class RegionalEscalationEstimate {
  code: string;
  name: string;
  threshold: number;
  region: string;
  externalRef: string;
  sendAt: number;
  status: RegionalEscalationEstimateStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    region: string,
    externalRef: string,
    sendAt: number,
    status: RegionalEscalationEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.region = region;
    this.externalRef = externalRef;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalEscalationEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalEscalationEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional escalation estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional escalation estimate"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.threshold * this.sendAt * 100) / 100;
  }

  copy(): RegionalEscalationEstimate {
    return new RegionalEscalationEstimate(
      this.code,
      this.name,
      this.threshold,
      this.region,
      this.externalRef,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a regional escalation estimate in status planned. */
export function newRegionalEscalationEstimate(code: string, name: string): RegionalEscalationEstimate {
  return new RegionalEscalationEstimate(code, name, 0, "", "", 0, "planned");
}
