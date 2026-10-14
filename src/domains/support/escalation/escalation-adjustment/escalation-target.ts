import * as text from "../../../../kit/text.js";

/** Where a escalation target is in its life cycle. */
export type EscalationTargetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A escalation target as the escalation team keeps it. */
export class EscalationTarget {
  code: string;
  label: string;
  region: string;
  campaignRef: string;
  revision: number;
  capacity: number;
  status: EscalationTargetStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    campaignRef: string,
    revision: number,
    capacity: number,
    status: EscalationTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.campaignRef = campaignRef;
    this.revision = revision;
    this.capacity = capacity;
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

  canMoveTo(next: EscalationTargetStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: EscalationTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"escalation target"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.revision * this.capacity * 100) / 100;
  }

  copy(): EscalationTarget {
    return new EscalationTarget(
      this.code,
      this.label,
      this.region,
      this.campaignRef,
      this.revision,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a escalation target in status open. */
export function newEscalationTarget(code: string, label: string): EscalationTarget {
  return new EscalationTarget(code, label, "", "", 0, 0, "open");
}
