import * as text from "../../../../kit/text.js";

/** Where a primary domain mapping is in its life cycle. */
export type PrimaryDomainMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a primary domain mapping and its current status. */
export class PrimaryDomainMapping {
  code: string;
  title: string;
  locale: string;
  retries: number;
  quantity: number;
  visible: boolean;
  region: string;
  journeyId: string;
  floorValue: number;
  graceDays: number;
  status: PrimaryDomainMappingStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    retries: number,
    quantity: number,
    visible: boolean,
    region: string,
    journeyId: string,
    floorValue: number,
    graceDays: number,
    status: PrimaryDomainMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.retries = retries;
    this.quantity = quantity;
    this.visible = visible;
    this.region = region;
    this.journeyId = journeyId;
    this.floorValue = floorValue;
    this.graceDays = graceDays;
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

  canMoveTo(next: PrimaryDomainMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryDomainMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary domain mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round((this.floorValue - this.graceDays) * 100) / 100;
  }

  copy(): PrimaryDomainMapping {
    return new PrimaryDomainMapping(
      this.code,
      this.title,
      this.locale,
      this.retries,
      this.quantity,
      this.visible,
      this.region,
      this.journeyId,
      this.floorValue,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary domain mapping in status open. */
export function newPrimaryDomainMapping(code: string, title: string): PrimaryDomainMapping {
  return new PrimaryDomainMapping(code, title, "", 0, 0, false, "", "", 0, 0, "open");
}
