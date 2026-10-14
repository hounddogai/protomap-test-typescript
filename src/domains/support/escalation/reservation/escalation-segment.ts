import * as text from "../../../../kit/text.js";

/** Where a escalation segment is in its life cycle. */
export type EscalationSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A escalation segment. Its code is unique within a tenant. */
export class EscalationSegment {
  code: string;
  name: string;
  threshold: number;
  contactEmail: string;
  campaignRef: string;
  ownerId: string;
  status: EscalationSegmentStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    contactEmail: string,
    campaignRef: string,
    ownerId: string,
    status: EscalationSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): EscalationSegment {
    return new EscalationSegment(
      this.code,
      this.name,
      this.threshold,
      this.contactEmail,
      this.campaignRef,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a escalation segment in status idle. */
export function newEscalationSegment(code: string, name: string): EscalationSegment {
  return new EscalationSegment(code, name, 0, "", "", "", "idle");
}
