/**
 * The global reward rule bundle records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global reward rule bundle is in its life cycle. */
export type GlobalRewardRuleBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One global reward rule bundle, with what the planners need to act on it. */
export class GlobalRewardRuleBundle {
  code: string;
  name: string;
  floorValue: number;
  unit: string;
  sendAt: number;
  attributes: Map<string, string>;
  updatedAt: number;
  ownerId: string;
  discount: number;
  version: number;
  startsAt: number;
  status: GlobalRewardRuleBundleStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    unit: string,
    sendAt: number,
    attributes: Map<string, string>,
    updatedAt: number,
    ownerId: string,
    discount: number,
    version: number,
    startsAt: number,
    status: GlobalRewardRuleBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.unit = unit;
    this.sendAt = sendAt;
    this.attributes = attributes;
    this.updatedAt = updatedAt;
    this.ownerId = ownerId;
    this.discount = discount;
    this.version = version;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalRewardRuleBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalRewardRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"global reward rule bundle"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round((this.startsAt - this.sendAt) * 100) / 100;
  }

  copy(): GlobalRewardRuleBundle {
    return new GlobalRewardRuleBundle(
      this.code,
      this.name,
      this.floorValue,
      this.unit,
      this.sendAt,
      this.attributes,
      this.updatedAt,
      this.ownerId,
      this.discount,
      this.version,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global reward rule bundle in status idle. */
export function newGlobalRewardRuleBundle(code: string, name: string): GlobalRewardRuleBundle {
  return new GlobalRewardRuleBundle(code, name, 0, "", 0, new Map<string, string>(), 0, "", 0, 0, 0, "idle");
}
