/**
 * The global window audit records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global window audit is in its life cycle. */
export type GlobalWindowAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One global window audit, with what the planners need to act on it. */
export class GlobalWindowAudit {
  code: string;
  name: string;
  country: string;
  limit: number;
  floorValue: number;
  batchSize: number;
  description: string;
  journeyId: string;
  graceDays: number;
  tags: string[];
  status: GlobalWindowAuditStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    limit: number,
    floorValue: number,
    batchSize: number,
    description: string,
    journeyId: string,
    graceDays: number,
    tags: string[],
    status: GlobalWindowAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.limit = limit;
    this.floorValue = floorValue;
    this.batchSize = batchSize;
    this.description = description;
    this.journeyId = journeyId;
    this.graceDays = graceDays;
    this.tags = tags;
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

  canMoveTo(next: GlobalWindowAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
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

  moveTo(next: GlobalWindowAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global window audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.batchSize - this.limit) * 100) / 100;
  }

  copy(): GlobalWindowAudit {
    return new GlobalWindowAudit(
      this.code,
      this.name,
      this.country,
      this.limit,
      this.floorValue,
      this.batchSize,
      this.description,
      this.journeyId,
      this.graceDays,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global window audit in status proposed. */
export function newGlobalWindowAudit(code: string, name: string): GlobalWindowAudit {
  return new GlobalWindowAudit(code, name, "", 0, 0, 0, "", "", 0, [], "proposed");
}
