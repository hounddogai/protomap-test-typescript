/**
 * The window estimate records of attribution's window work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window estimate is in its life cycle. */
export type WindowEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** A window estimate. Its code is unique within a tenant. */
export class WindowEstimate {
  code: string;
  name: string;
  reviewer: string;
  label: string;
  version: number;
  active: boolean;
  retries: number;
  source: string;
  status: WindowEstimateStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    label: string,
    version: number,
    active: boolean,
    retries: number,
    source: string,
    status: WindowEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.label = label;
    this.version = version;
    this.active = active;
    this.retries = retries;
    this.source = source;
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

  canMoveTo(next: WindowEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  netValue(): number {
    return Math.round((this.version - this.retries) * 100) / 100;
  }

  copy(): WindowEstimate {
    return new WindowEstimate(
      this.code,
      this.name,
      this.reviewer,
      this.label,
      this.version,
      this.active,
      this.retries,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a window estimate in status requested. */
export function newWindowEstimate(code: string, name: string): WindowEstimate {
  return new WindowEstimate(code, name, "", "", 0, false, 0, "", "requested");
}
