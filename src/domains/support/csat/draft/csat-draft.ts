/**
 * The csat draft records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat draft is in its life cycle. */
export type CsatDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a csat draft and its current status. */
export class CsatDraft {
  code: string;
  label: string;
  locale: string;
  utmSource: string;
  ratio: number;
  active: boolean;
  conversionRate: number;
  maximum: number;
  priority: number;
  sequence: number;
  segment: string;
  status: CsatDraftStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    utmSource: string,
    ratio: number,
    active: boolean,
    conversionRate: number,
    maximum: number,
    priority: number,
    sequence: number,
    segment: string,
    status: CsatDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.active = active;
    this.conversionRate = conversionRate;
    this.maximum = maximum;
    this.priority = priority;
    this.sequence = sequence;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"csat draft"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.maximum + this.ratio) * 100) / 100;
  }

  copy(): CsatDraft {
    return new CsatDraft(
      this.code,
      this.label,
      this.locale,
      this.utmSource,
      this.ratio,
      this.active,
      this.conversionRate,
      this.maximum,
      this.priority,
      this.sequence,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a csat draft in status draft. */
export function newCsatDraft(code: string, label: string): CsatDraft {
  return new CsatDraft(code, label, "", "", 0, false, 0, 0, 0, 0, "", "draft");
}
