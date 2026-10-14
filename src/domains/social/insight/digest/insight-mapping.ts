import * as text from "../../../../kit/text.js";

/** Where a insight mapping is in its life cycle. */
export type InsightMappingStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a insight mapping and its current status. */
export class InsightMapping {
  code: string;
  name: string;
  source: string;
  channel: string;
  country: string;
  summary: string;
  discount: number;
  externalRef: string;
  unit: string;
  locale: string;
  revision: number;
  status: InsightMappingStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    channel: string,
    country: string,
    summary: string,
    discount: number,
    externalRef: string,
    unit: string,
    locale: string,
    revision: number,
    status: InsightMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.channel = channel;
    this.country = country;
    this.summary = summary;
    this.discount = discount;
    this.externalRef = externalRef;
    this.unit = unit;
    this.locale = locale;
    this.revision = revision;
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

  canMoveTo(next: InsightMappingStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
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

  moveTo(next: InsightMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"insight mapping"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.revision - this.discount) * 100) / 100;
  }

  copy(): InsightMapping {
    return new InsightMapping(
      this.code,
      this.name,
      this.source,
      this.channel,
      this.country,
      this.summary,
      this.discount,
      this.externalRef,
      this.unit,
      this.locale,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a insight mapping in status new. */
export function newInsightMapping(code: string, name: string): InsightMapping {
  return new InsightMapping(code, name, "", "", "", "", 0, "", "", "", 0, "new");
}
