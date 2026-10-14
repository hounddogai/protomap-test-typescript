import * as text from "../../../../kit/text.js";

/** Where a manual sla quota is in its life cycle. */
export type ManualSlaQuotaStatus = "created" | "validated" | "published" | "retired";

/** The record of a manual sla quota and its current status. */
export class ManualSlaQuota {
  code: string;
  label: string;
  priority: number;
  budget: number;
  batchSize: number;
  startsAt: number;
  status: ManualSlaQuotaStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    budget: number,
    batchSize: number,
    startsAt: number,
    status: ManualSlaQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.budget = budget;
    this.batchSize = batchSize;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualSlaQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualSlaQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual sla quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"manual sla quota"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.startsAt * this.budget * 100) / 100;
  }

  copy(): ManualSlaQuota {
    return new ManualSlaQuota(
      this.code,
      this.label,
      this.priority,
      this.budget,
      this.batchSize,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual sla quota in status created. */
export function newManualSlaQuota(code: string, label: string): ManualSlaQuota {
  return new ManualSlaQuota(code, label, 0, 0, 0, 0, "created");
}
