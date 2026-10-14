/**
 * The scheduled path template records of attribution's path work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled path template is in its life cycle. */
export type ScheduledPathTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled path template. Its code is unique within a tenant. */
export class ScheduledPathTemplate {
  code: string;
  name: string;
  source: string;
  active: boolean;
  createdAt: number;
  status: ScheduledPathTemplateStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    active: boolean,
    createdAt: number,
    status: ScheduledPathTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.active = active;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledPathTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledPathTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled path template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): ScheduledPathTemplate {
    return new ScheduledPathTemplate(this.code, this.name, this.source, this.active, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled path template in status requested. */
export function newScheduledPathTemplate(code: string, name: string): ScheduledPathTemplate {
  return new ScheduledPathTemplate(code, name, "", false, 0, "requested");
}
