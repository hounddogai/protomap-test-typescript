import * as text from "../../../../kit/text.js";

/** Where a primary sla schedule is in its life cycle. */
export type PrimarySlaScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary sla schedule and its current status. */
export class PrimarySlaSchedule {
  code: string;
  name: string;
  createdAt: number;
  locale: string;
  version: number;
  status: PrimarySlaScheduleStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    locale: string,
    version: number,
    status: PrimarySlaScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.locale = locale;
    this.version = version;
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

  canMoveTo(next: PrimarySlaScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimarySlaScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sla schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"primary sla schedule"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.version + this.createdAt) * 100) / 100;
  }

  copy(): PrimarySlaSchedule {
    return new PrimarySlaSchedule(this.code, this.name, this.createdAt, this.locale, this.version, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary sla schedule in status requested. */
export function newPrimarySlaSchedule(code: string, name: string): PrimarySlaSchedule {
  return new PrimarySlaSchedule(code, name, 0, "", 0, "requested");
}
