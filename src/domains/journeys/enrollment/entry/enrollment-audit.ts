import * as text from "../../../../kit/text.js";

/** Where a enrollment audit is in its life cycle. */
export type EnrollmentAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a enrollment audit and its current status. */
export class EnrollmentAudit {
  code: string;
  name: string;
  ownerId: string;
  conversionRate: number;
  maximum: number;
  margin: number;
  sequence: number;
  notes: string;
  campaignRef: string;
  status: EnrollmentAuditStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    conversionRate: number,
    maximum: number,
    margin: number,
    sequence: number,
    notes: string,
    campaignRef: string,
    status: EnrollmentAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.conversionRate = conversionRate;
    this.maximum = maximum;
    this.margin = margin;
    this.sequence = sequence;
    this.notes = notes;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: EnrollmentAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round(this.margin * this.sequence * 100) / 100;
  }

  copy(): EnrollmentAudit {
    return new EnrollmentAudit(
      this.code,
      this.name,
      this.ownerId,
      this.conversionRate,
      this.maximum,
      this.margin,
      this.sequence,
      this.notes,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a enrollment audit in status idle. */
export function newEnrollmentAudit(code: string, name: string): EnrollmentAudit {
  return new EnrollmentAudit(code, name, "", 0, 0, 0, 0, "", "", "idle");
}
