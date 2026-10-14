/**
 * The creative rule records of adops's creative work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative rule is in its life cycle. */
export type CreativeRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a creative rule and its current status. */
export class CreativeRule {
  code: string;
  title: string;
  sequence: number;
  ceiling: number;
  channel: string;
  conversionRate: number;
  createdAt: number;
  openRate: number;
  status: CreativeRuleStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    ceiling: number,
    channel: string,
    conversionRate: number,
    createdAt: number,
    openRate: number,
    status: CreativeRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.ceiling = ceiling;
    this.channel = channel;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.openRate = openRate;
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

  canMoveTo(next: CreativeRuleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"creative rule"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.conversionRate - this.openRate) * 100) / 100;
  }

  copy(): CreativeRule {
    return new CreativeRule(
      this.code,
      this.title,
      this.sequence,
      this.ceiling,
      this.channel,
      this.conversionRate,
      this.createdAt,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a creative rule in status new. */
export function newCreativeRule(code: string, title: string): CreativeRule {
  return new CreativeRule(code, title, 0, 0, "", 0, 0, 0, "new");
}
