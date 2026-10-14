/**
 * The sla exception records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla exception is in its life cycle. */
export type SlaExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A sla exception. Its code is unique within a tenant. */
export class SlaException {
  code: string;
  label: string;
  tags: string[];
  pinned: boolean;
  externalRef: string;
  checksum: string;
  capacity: number;
  status: SlaExceptionStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    pinned: boolean,
    externalRef: string,
    checksum: string,
    capacity: number,
    status: SlaExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.pinned = pinned;
    this.externalRef = externalRef;
    this.checksum = checksum;
    this.capacity = capacity;
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

  canMoveTo(next: SlaExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SlaExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): SlaException {
    return new SlaException(
      this.code,
      this.label,
      this.tags,
      this.pinned,
      this.externalRef,
      this.checksum,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sla exception in status proposed. */
export function newSlaException(code: string, label: string): SlaException {
  return new SlaException(code, label, [], false, "", "", 0, "proposed");
}
