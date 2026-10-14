/**
 * The default opt out rule records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default opt out rule is in its life cycle. */
export type DefaultOptOutRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default opt out rule. Its code is unique within a tenant. */
export class DefaultOptOutRule {
  code: string;
  name: string;
  ownerId: string;
  channel: string;
  ratio: number;
  expiresAt: number;
  journeyId: string;
  margin: number;
  category: string;
  floorValue: number;
  status: DefaultOptOutRuleStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    channel: string,
    ratio: number,
    expiresAt: number,
    journeyId: string,
    margin: number,
    category: string,
    floorValue: number,
    status: DefaultOptOutRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.channel = channel;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.journeyId = journeyId;
    this.margin = margin;
    this.category = category;
    this.floorValue = floorValue;
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

  canMoveTo(next: DefaultOptOutRuleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultOptOutRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default opt out rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default opt out rule"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.expiresAt * this.margin * 100) / 100;
  }

  copy(): DefaultOptOutRule {
    return new DefaultOptOutRule(
      this.code,
      this.name,
      this.ownerId,
      this.channel,
      this.ratio,
      this.expiresAt,
      this.journeyId,
      this.margin,
      this.category,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default opt out rule in status open. */
export function newDefaultOptOutRule(code: string, name: string): DefaultOptOutRule {
  return new DefaultOptOutRule(code, name, "", "", 0, 0, "", 0, "", 0, "open");
}
