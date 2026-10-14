import * as text from "../../../../kit/text.js";

/** Where a csat mapping is in its life cycle. */
export type CsatMappingStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A csat mapping. Its code is unique within a tenant. */
export class CsatMapping {
  code: string;
  name: string;
  locale: string;
  attempts: number;
  attributes: Map<string, string>;
  bid: number;
  reviewer: string;
  status: CsatMappingStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    attempts: number,
    attributes: Map<string, string>,
    bid: number,
    reviewer: string,
    status: CsatMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.attempts = attempts;
    this.attributes = attributes;
    this.bid = bid;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatMappingStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round(this.attempts * this.bid * 100) / 100;
  }

  copy(): CsatMapping {
    return new CsatMapping(
      this.code,
      this.name,
      this.locale,
      this.attempts,
      this.attributes,
      this.bid,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a csat mapping in status idle. */
export function newCsatMapping(code: string, name: string): CsatMapping {
  return new CsatMapping(code, name, "", 0, new Map<string, string>(), 0, "", "idle");
}
