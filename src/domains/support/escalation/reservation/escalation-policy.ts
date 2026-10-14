import * as text from "../../../../kit/text.js";

/** Where a escalation policy is in its life cycle. */
export type EscalationPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A escalation policy as the escalation team keeps it. */
export class EscalationPolicy {
  code: string;
  name: string;
  externalRef: string;
  audienceId: string;
  sequence: number;
  startsAt: number;
  sendAt: number;
  reviewer: string;
  revision: number;
  priority: number;
  clicks: number;
  status: EscalationPolicyStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    audienceId: string,
    sequence: number,
    startsAt: number,
    sendAt: number,
    reviewer: string,
    revision: number,
    priority: number,
    clicks: number,
    status: EscalationPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.revision = revision;
    this.priority = priority;
    this.clicks = clicks;
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

  canMoveTo(next: EscalationPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
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

  moveTo(next: EscalationPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedLoad(): number {
    return Math.round((this.revision - this.priority) * 100) / 100;
  }

  copy(): EscalationPolicy {
    return new EscalationPolicy(
      this.code,
      this.name,
      this.externalRef,
      this.audienceId,
      this.sequence,
      this.startsAt,
      this.sendAt,
      this.reviewer,
      this.revision,
      this.priority,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a escalation policy in status proposed. */
export function newEscalationPolicy(code: string, name: string): EscalationPolicy {
  return new EscalationPolicy(code, name, "", "", 0, 0, 0, "", 0, 0, 0, "proposed");
}
