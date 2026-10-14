import * as text from "../../../../kit/text.js";

/** Where a sla tier is in its life cycle. */
export type SlaTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a sla tier and its current status. */
export class SlaTier {
  code: string;
  name: string;
  conversionRate: number;
  active: boolean;
  utmSource: string;
  batchSize: number;
  phone: string;
  status: SlaTierStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    active: boolean,
    utmSource: string,
    batchSize: number,
    phone: string,
    status: SlaTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.active = active;
    this.utmSource = utmSource;
    this.batchSize = batchSize;
    this.phone = phone;
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

  canMoveTo(next: SlaTierStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
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

  moveTo(next: SlaTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"sla tier"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.conversionRate - this.batchSize) * 100) / 100;
  }

  copy(): SlaTier {
    return new SlaTier(
      this.code,
      this.name,
      this.conversionRate,
      this.active,
      this.utmSource,
      this.batchSize,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a sla tier in status open. */
export function newSlaTier(code: string, name: string): SlaTier {
  return new SlaTier(code, name, 0, false, "", 0, "", "open");
}
