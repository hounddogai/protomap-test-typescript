import * as text from "../../../../kit/text.js";

/** Where a primary conversion audit is in its life cycle. */
export type PrimaryConversionAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A primary conversion audit as the conversion team keeps it. */
export class PrimaryConversionAudit {
  code: string;
  title: string;
  budget: number;
  journeyId: string;
  locale: string;
  attempts: number;
  archived: boolean;
  margin: number;
  externalRef: string;
  version: number;
  status: PrimaryConversionAuditStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    journeyId: string,
    locale: string,
    attempts: number,
    archived: boolean,
    margin: number,
    externalRef: string,
    version: number,
    status: PrimaryConversionAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.journeyId = journeyId;
    this.locale = locale;
    this.attempts = attempts;
    this.archived = archived;
    this.margin = margin;
    this.externalRef = externalRef;
    this.version = version;
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

  canMoveTo(next: PrimaryConversionAuditStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
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

  moveTo(next: PrimaryConversionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary conversion audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.attempts * this.budget * 100) / 100;
  }

  copy(): PrimaryConversionAudit {
    return new PrimaryConversionAudit(
      this.code,
      this.title,
      this.budget,
      this.journeyId,
      this.locale,
      this.attempts,
      this.archived,
      this.margin,
      this.externalRef,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary conversion audit in status open. */
export function newPrimaryConversionAudit(code: string, title: string): PrimaryConversionAudit {
  return new PrimaryConversionAudit(code, title, 0, "", "", 0, false, 0, "", 0, "open");
}
