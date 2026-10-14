/**
 * The manual wait target records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual wait target is in its life cycle. */
export type ManualWaitTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual wait target. Its code is unique within a tenant. */
export class ManualWaitTarget {
  code: string;
  name: string;
  locale: string;
  externalRef: string;
  title: string;
  rate: number;
  variant: string;
  checksum: string;
  status: ManualWaitTargetStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    externalRef: string,
    title: string,
    rate: number,
    variant: string,
    checksum: string,
    status: ManualWaitTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.externalRef = externalRef;
    this.title = title;
    this.rate = rate;
    this.variant = variant;
    this.checksum = checksum;
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

  canMoveTo(next: ManualWaitTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualWaitTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual wait target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): ManualWaitTarget {
    return new ManualWaitTarget(
      this.code,
      this.name,
      this.locale,
      this.externalRef,
      this.title,
      this.rate,
      this.variant,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual wait target in status draft. */
export function newManualWaitTarget(code: string, name: string): ManualWaitTarget {
  return new ManualWaitTarget(code, name, "", "", "", 0, "", "", "draft");
}
