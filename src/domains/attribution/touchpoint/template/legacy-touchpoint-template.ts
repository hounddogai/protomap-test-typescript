/**
 * The legacy touchpoint template records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy touchpoint template is in its life cycle. */
export type LegacyTouchpointTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy touchpoint template as the touchpoint team keeps it. */
export class LegacyTouchpointTemplate {
  code: string;
  name: string;
  version: number;
  createdAt: number;
  category: string;
  status: LegacyTouchpointTemplateStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    createdAt: number,
    category: string,
    status: LegacyTouchpointTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.createdAt = createdAt;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyTouchpointTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyTouchpointTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy touchpoint template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveTotal(): number {
    return Math.round((this.createdAt - this.version) * 100) / 100;
  }

  copy(): LegacyTouchpointTemplate {
    return new LegacyTouchpointTemplate(this.code, this.name, this.version, this.createdAt, this.category, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy touchpoint template in status draft. */
export function newLegacyTouchpointTemplate(code: string, name: string): LegacyTouchpointTemplate {
  return new LegacyTouchpointTemplate(code, name, 0, 0, "", "draft");
}
