/**
 * The post rule records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post rule is in its life cycle. */
export type PostRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A post rule. Its code is unique within a tenant. */
export class PostRule {
  code: string;
  name: string;
  variant: string;
  summary: string;
  floorValue: number;
  timezone: string;
  updatedAt: number;
  discount: number;
  attributes: Map<string, string>;
  channel: string;
  status: PostRuleStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    summary: string,
    floorValue: number,
    timezone: string,
    updatedAt: number,
    discount: number,
    attributes: Map<string, string>,
    channel: string,
    status: PostRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.summary = summary;
    this.floorValue = floorValue;
    this.timezone = timezone;
    this.updatedAt = updatedAt;
    this.discount = discount;
    this.attributes = attributes;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PostRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round(this.floorValue * this.discount * 100) / 100;
  }

  copy(): PostRule {
    return new PostRule(
      this.code,
      this.name,
      this.variant,
      this.summary,
      this.floorValue,
      this.timezone,
      this.updatedAt,
      this.discount,
      this.attributes,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a post rule in status planned. */
export function newPostRule(code: string, name: string): PostRule {
  return new PostRule(code, name, "", "", 0, "", 0, 0, new Map<string, string>(), "", "planned");
}
