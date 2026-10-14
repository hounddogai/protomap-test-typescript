/**
 * The escalation draft records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation draft is in its life cycle. */
export type EscalationDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a escalation draft and its current status. */
export class EscalationDraft {
  code: string;
  label: string;
  utmSource: string;
  name: string;
  margin: number;
  discount: number;
  status: EscalationDraftStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    name: string,
    margin: number,
    discount: number,
    status: EscalationDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.name = name;
    this.margin = margin;
    this.discount = discount;
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

  canMoveTo(next: EscalationDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: EscalationDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.discount - this.margin) * 100) / 100;
  }

  copy(): EscalationDraft {
    return new EscalationDraft(
      this.code,
      this.label,
      this.utmSource,
      this.name,
      this.margin,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a escalation draft in status requested. */
export function newEscalationDraft(code: string, label: string): EscalationDraft {
  return new EscalationDraft(code, label, "", "", 0, 0, "requested");
}
