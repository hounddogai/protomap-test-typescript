/**
 * The path rule records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path rule is in its life cycle. */
export type PathRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A path rule as the path team keeps it. */
export class PathRule {
  code: string;
  name: string;
  phone: string;
  bid: number;
  channel: string;
  locale: string;
  segment: string;
  reviewer: string;
  sendAt: number;
  attributes: Map<string, string>;
  status: PathRuleStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    bid: number,
    channel: string,
    locale: string,
    segment: string,
    reviewer: string,
    sendAt: number,
    attributes: Map<string, string>,
    status: PathRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.bid = bid;
    this.channel = channel;
    this.locale = locale;
    this.segment = segment;
    this.reviewer = reviewer;
    this.sendAt = sendAt;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathRuleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PathRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"path rule"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round((this.sendAt + this.bid) * 100) / 100;
  }

  copy(): PathRule {
    return new PathRule(
      this.code,
      this.name,
      this.phone,
      this.bid,
      this.channel,
      this.locale,
      this.segment,
      this.reviewer,
      this.sendAt,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a path rule in status new. */
export function newPathRule(code: string, name: string): PathRule {
  return new PathRule(code, name, "", 0, "", "", "", "", 0, new Map<string, string>(), "new");
}
