/**
 * The funnel rule records of growth's funnel work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a funnel rule is in its life cycle. */
export type FunnelRuleStatus = "requested" | "granted" | "revoked" | "expired";

/** A funnel rule. Its code is unique within a tenant. */
export class FunnelRule {
  code: string;
  title: string;
  durationMinutes: number;
  windowDays: number;
  audienceId: string;
  source: string;
  batchSize: number;
  status: FunnelRuleStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    windowDays: number,
    audienceId: string,
    source: string,
    batchSize: number,
    status: FunnelRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.windowDays = windowDays;
    this.audienceId = audienceId;
    this.source = source;
    this.batchSize = batchSize;
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

  canMoveTo(next: FunnelRuleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FunnelRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"funnel rule"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.windowDays * this.durationMinutes * 100) / 100;
  }

  copy(): FunnelRule {
    return new FunnelRule(
      this.code,
      this.title,
      this.durationMinutes,
      this.windowDays,
      this.audienceId,
      this.source,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a funnel rule in status requested. */
export function newFunnelRule(code: string, title: string): FunnelRule {
  return new FunnelRule(code, title, 0, 0, "", "", 0, "requested");
}
