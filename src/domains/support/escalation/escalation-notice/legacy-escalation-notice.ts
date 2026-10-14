/**
 * The legacy escalation notice records of support's escalation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy escalation notice is in its life cycle. */
export type LegacyEscalationNoticeStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One legacy escalation notice, with what the planners need to act on it. */
export class LegacyEscalationNotice {
  code: string;
  label: string;
  amount: number;
  attempts: number;
  externalRef: string;
  source: string;
  description: string;
  openRate: number;
  category: string;
  version: number;
  priority: number;
  status: LegacyEscalationNoticeStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    attempts: number,
    externalRef: string,
    source: string,
    description: string,
    openRate: number,
    category: string,
    version: number,
    priority: number,
    status: LegacyEscalationNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.attempts = attempts;
    this.externalRef = externalRef;
    this.source = source;
    this.description = description;
    this.openRate = openRate;
    this.category = category;
    this.version = version;
    this.priority = priority;
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

  canMoveTo(next: LegacyEscalationNoticeStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyEscalationNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy escalation notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netLoad(): number {
    return Math.round((this.attempts - this.version) * 100) / 100;
  }

  copy(): LegacyEscalationNotice {
    return new LegacyEscalationNotice(
      this.code,
      this.label,
      this.amount,
      this.attempts,
      this.externalRef,
      this.source,
      this.description,
      this.openRate,
      this.category,
      this.version,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy escalation notice in status planned. */
export function newLegacyEscalationNotice(code: string, label: string): LegacyEscalationNotice {
  return new LegacyEscalationNotice(code, label, 0, 0, "", "", "", 0, "", 0, 0, "planned");
}
