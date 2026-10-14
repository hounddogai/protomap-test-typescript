import * as text from "../../../../kit/text.js";

/** Where a domain audit is in its life cycle. */
export type DomainAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a domain audit and its current status. */
export class DomainAudit {
  code: string;
  title: string;
  updatedAt: number;
  label: string;
  clicks: number;
  variant: string;
  createdAt: number;
  checksum: string;
  unit: string;
  name: string;
  status: DomainAuditStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    label: string,
    clicks: number,
    variant: string,
    createdAt: number,
    checksum: string,
    unit: string,
    name: string,
    status: DomainAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.label = label;
    this.clicks = clicks;
    this.variant = variant;
    this.createdAt = createdAt;
    this.checksum = checksum;
    this.unit = unit;
    this.name = name;
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

  canMoveTo(next: DomainAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: DomainAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.updatedAt + this.createdAt) * 100) / 100;
  }

  copy(): DomainAudit {
    return new DomainAudit(
      this.code,
      this.title,
      this.updatedAt,
      this.label,
      this.clicks,
      this.variant,
      this.createdAt,
      this.checksum,
      this.unit,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a domain audit in status idle. */
export function newDomainAudit(code: string, title: string): DomainAudit {
  return new DomainAudit(code, title, 0, "", 0, "", 0, "", "", "", "idle");
}
