/**
 * The rolling domain mapping records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling domain mapping is in its life cycle. */
export type RollingDomainMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling domain mapping. Its code is unique within a tenant. */
export class RollingDomainMapping {
  code: string;
  title: string;
  audienceId: string;
  priority: number;
  sendAt: number;
  currency: string;
  status: RollingDomainMappingStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    priority: number,
    sendAt: number,
    currency: string,
    status: RollingDomainMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.priority = priority;
    this.sendAt = sendAt;
    this.currency = currency;
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

  canMoveTo(next: RollingDomainMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingDomainMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling domain mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.sendAt - this.priority) * 100) / 100;
  }

  copy(): RollingDomainMapping {
    return new RollingDomainMapping(
      this.code,
      this.title,
      this.audienceId,
      this.priority,
      this.sendAt,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling domain mapping in status open. */
export function newRollingDomainMapping(code: string, title: string): RollingDomainMapping {
  return new RollingDomainMapping(code, title, "", 0, 0, "", "open");
}
