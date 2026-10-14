/**
 * The global badge template records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global badge template is in its life cycle. */
export type GlobalBadgeTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A global badge template. Its code is unique within a tenant. */
export class GlobalBadgeTemplate {
  code: string;
  label: string;
  campaignRef: string;
  sequence: number;
  notes: string;
  visible: boolean;
  conversionRate: number;
  audienceId: string;
  quantity: number;
  status: GlobalBadgeTemplateStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    sequence: number,
    notes: string,
    visible: boolean,
    conversionRate: number,
    audienceId: string,
    quantity: number,
    status: GlobalBadgeTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.sequence = sequence;
    this.notes = notes;
    this.visible = visible;
    this.conversionRate = conversionRate;
    this.audienceId = audienceId;
    this.quantity = quantity;
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

  canMoveTo(next: GlobalBadgeTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: GlobalBadgeTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global badge template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round(this.conversionRate * this.quantity * 100) / 100;
  }

  copy(): GlobalBadgeTemplate {
    return new GlobalBadgeTemplate(
      this.code,
      this.label,
      this.campaignRef,
      this.sequence,
      this.notes,
      this.visible,
      this.conversionRate,
      this.audienceId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global badge template in status open. */
export function newGlobalBadgeTemplate(code: string, label: string): GlobalBadgeTemplate {
  return new GlobalBadgeTemplate(code, label, "", 0, "", false, 0, "", 0, "open");
}
