import * as text from "../../../../kit/text.js";

/** Where a csat rule is in its life cycle. */
export type CsatRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a csat rule and its current status. */
export class CsatRule {
  code: string;
  title: string;
  revision: number;
  graceDays: number;
  archived: boolean;
  externalRef: string;
  journeyId: string;
  locale: string;
  summary: string;
  checksum: string;
  status: CsatRuleStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    graceDays: number,
    archived: boolean,
    externalRef: string,
    journeyId: string,
    locale: string,
    summary: string,
    checksum: string,
    status: CsatRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.graceDays = graceDays;
    this.archived = archived;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.locale = locale;
    this.summary = summary;
    this.checksum = checksum;
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

  canMoveTo(next: CsatRuleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netExposure(): number {
    return Math.round(this.revision * this.graceDays * 100) / 100;
  }

  copy(): CsatRule {
    return new CsatRule(
      this.code,
      this.title,
      this.revision,
      this.graceDays,
      this.archived,
      this.externalRef,
      this.journeyId,
      this.locale,
      this.summary,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a csat rule in status new. */
export function newCsatRule(code: string, title: string): CsatRule {
  return new CsatRule(code, title, 0, 0, false, "", "", "", "", "", "new");
}
