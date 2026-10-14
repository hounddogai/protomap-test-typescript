import * as text from "../../../../kit/text.js";

/** Where a scheduled complaint audit is in its life cycle. */
export type ScheduledComplaintAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a scheduled complaint audit and its current status. */
export class ScheduledComplaintAudit {
  code: string;
  label: string;
  channel: string;
  active: boolean;
  description: string;
  minimum: number;
  status: ScheduledComplaintAuditStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    active: boolean,
    description: string,
    minimum: number,
    status: ScheduledComplaintAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.active = active;
    this.description = description;
    this.minimum = minimum;
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

  canMoveTo(next: ScheduledComplaintAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: ScheduledComplaintAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled complaint audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): ScheduledComplaintAudit {
    return new ScheduledComplaintAudit(
      this.code,
      this.label,
      this.channel,
      this.active,
      this.description,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled complaint audit in status proposed. */
export function newScheduledComplaintAudit(code: string, label: string): ScheduledComplaintAudit {
  return new ScheduledComplaintAudit(code, label, "", false, "", 0, "proposed");
}
