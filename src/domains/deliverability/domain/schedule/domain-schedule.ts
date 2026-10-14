/**
 * The domain schedule records of deliverability's domain work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a domain schedule is in its life cycle. */
export type DomainScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A domain schedule. Its code is unique within a tenant. */
export class DomainSchedule {
  code: string;
  label: string;
  utmSource: string;
  locale: string;
  channel: string;
  description: string;
  endsAt: number;
  maximum: number;
  status: DomainScheduleStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    locale: string,
    channel: string,
    description: string,
    endsAt: number,
    maximum: number,
    status: DomainScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.locale = locale;
    this.channel = channel;
    this.description = description;
    this.endsAt = endsAt;
    this.maximum = maximum;
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

  canMoveTo(next: DomainScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"domain schedule"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.endsAt - this.maximum) * 100) / 100;
  }

  copy(): DomainSchedule {
    return new DomainSchedule(
      this.code,
      this.label,
      this.utmSource,
      this.locale,
      this.channel,
      this.description,
      this.endsAt,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a domain schedule in status draft. */
export function newDomainSchedule(code: string, label: string): DomainSchedule {
  return new DomainSchedule(code, label, "", "", "", "", 0, 0, "draft");
}
