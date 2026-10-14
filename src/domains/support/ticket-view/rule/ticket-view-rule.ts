/**
 * The ticket view rule records of support's ticket view work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view rule is in its life cycle. */
export type TicketViewRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A ticket view rule. Its code is unique within a tenant. */
export class TicketViewRule {
  code: string;
  label: string;
  impressions: number;
  score: number;
  floorValue: number;
  segment: string;
  audienceId: string;
  status: TicketViewRuleStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    score: number,
    floorValue: number,
    segment: string,
    audienceId: string,
    status: TicketViewRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.score = score;
    this.floorValue = floorValue;
    this.segment = segment;
    this.audienceId = audienceId;
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

  canMoveTo(next: TicketViewRuleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round(this.floorValue * this.score * 100) / 100;
  }

  copy(): TicketViewRule {
    return new TicketViewRule(
      this.code,
      this.label,
      this.impressions,
      this.score,
      this.floorValue,
      this.segment,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a ticket view rule in status open. */
export function newTicketViewRule(code: string, label: string): TicketViewRule {
  return new TicketViewRule(code, label, 0, 0, 0, "", "", "open");
}
