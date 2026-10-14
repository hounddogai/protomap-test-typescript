import * as text from "../../../../kit/text.js";

/** Where a regional step audit is in its life cycle. */
export type RegionalStepAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional step audit as the step team keeps it. */
export class RegionalStepAudit {
  code: string;
  title: string;
  capacity: number;
  conversionRate: number;
  archived: boolean;
  externalRef: string;
  ratio: number;
  status: RegionalStepAuditStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    conversionRate: number,
    archived: boolean,
    externalRef: string,
    ratio: number,
    status: RegionalStepAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.conversionRate = conversionRate;
    this.archived = archived;
    this.externalRef = externalRef;
    this.ratio = ratio;
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

  canMoveTo(next: RegionalStepAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalStepAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional step audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.conversionRate - this.capacity) * 100) / 100;
  }

  copy(): RegionalStepAudit {
    return new RegionalStepAudit(
      this.code,
      this.title,
      this.capacity,
      this.conversionRate,
      this.archived,
      this.externalRef,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional step audit in status idle. */
export function newRegionalStepAudit(code: string, title: string): RegionalStepAudit {
  return new RegionalStepAudit(code, title, 0, 0, false, "", 0, "idle");
}
