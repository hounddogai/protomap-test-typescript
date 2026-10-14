/**
 * The conversion ledger records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion ledger is in its life cycle. */
export type ConversionLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A conversion ledger. Its code is unique within a tenant. */
export class ConversionLedger {
  code: string;
  name: string;
  weight: number;
  summary: string;
  tags: string[];
  checksum: string;
  locale: string;
  utmSource: string;
  startsAt: number;
  label: string;
  status: ConversionLedgerStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    summary: string,
    tags: string[],
    checksum: string,
    locale: string,
    utmSource: string,
    startsAt: number,
    label: string,
    status: ConversionLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.summary = summary;
    this.tags = tags;
    this.checksum = checksum;
    this.locale = locale;
    this.utmSource = utmSource;
    this.startsAt = startsAt;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ConversionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"conversion ledger"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round((this.weight - this.startsAt) * 100) / 100;
  }

  copy(): ConversionLedger {
    return new ConversionLedger(
      this.code,
      this.name,
      this.weight,
      this.summary,
      this.tags,
      this.checksum,
      this.locale,
      this.utmSource,
      this.startsAt,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a conversion ledger in status proposed. */
export function newConversionLedger(code: string, name: string): ConversionLedger {
  return new ConversionLedger(code, name, 0, "", [], "", "", "", 0, "", "proposed");
}
