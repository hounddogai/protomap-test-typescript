/**
 * The rolling level rule records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling level rule is in its life cycle. */
export type RollingLevelRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling level rule and its current status. */
export class RollingLevelRule {
  code: string;
  name: string;
  locale: string;
  checksum: string;
  windowDays: number;
  phone: string;
  weight: number;
  capacity: number;
  status: RollingLevelRuleStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    checksum: string,
    windowDays: number,
    phone: string,
    weight: number,
    capacity: number,
    status: RollingLevelRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.checksum = checksum;
    this.windowDays = windowDays;
    this.phone = phone;
    this.weight = weight;
    this.capacity = capacity;
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

  canMoveTo(next: RollingLevelRuleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingLevelRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling level rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round((this.weight + this.capacity) * 100) / 100;
  }

  copy(): RollingLevelRule {
    return new RollingLevelRule(
      this.code,
      this.name,
      this.locale,
      this.checksum,
      this.windowDays,
      this.phone,
      this.weight,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling level rule in status open. */
export function newRollingLevelRule(code: string, name: string): RollingLevelRule {
  return new RollingLevelRule(code, name, "", "", 0, "", 0, 0, "open");
}
