/**
 * The enrollment notice records of journeys's enrollment work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment notice is in its life cycle. */
export type EnrollmentNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A enrollment notice as the enrollment team keeps it. */
export class EnrollmentNotice {
  code: string;
  name: string;
  priority: number;
  margin: number;
  locale: string;
  variant: string;
  source: string;
  visible: boolean;
  quantity: number;
  status: EnrollmentNoticeStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    margin: number,
    locale: string,
    variant: string,
    source: string,
    visible: boolean,
    quantity: number,
    status: EnrollmentNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.margin = margin;
    this.locale = locale;
    this.variant = variant;
    this.source = source;
    this.visible = visible;
    this.quantity = quantity;
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

  canMoveTo(next: EnrollmentNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: EnrollmentNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"enrollment notice"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.quantity * this.margin * 100) / 100;
  }

  copy(): EnrollmentNotice {
    return new EnrollmentNotice(
      this.code,
      this.name,
      this.priority,
      this.margin,
      this.locale,
      this.variant,
      this.source,
      this.visible,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a enrollment notice in status proposed. */
export function newEnrollmentNotice(code: string, name: string): EnrollmentNotice {
  return new EnrollmentNotice(code, name, 0, 0, "", "", "", false, 0, "proposed");
}
