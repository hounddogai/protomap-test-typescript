/**
 * The journey audit records of journeys's journey work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey audit is in its life cycle. */
export type JourneyAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A journey audit. Its code is unique within a tenant. */
export class JourneyAudit {
  code: string;
  name: string;
  priority: number;
  locale: string;
  archived: boolean;
  clicks: number;
  segment: string;
  retries: number;
  attributes: Map<string, string>;
  utmSource: string;
  status: JourneyAuditStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    locale: string,
    archived: boolean,
    clicks: number,
    segment: string,
    retries: number,
    attributes: Map<string, string>,
    utmSource: string,
    status: JourneyAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.locale = locale;
    this.archived = archived;
    this.clicks = clicks;
    this.segment = segment;
    this.retries = retries;
    this.attributes = attributes;
    this.utmSource = utmSource;
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

  canMoveTo(next: JourneyAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: JourneyAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round(this.clicks * this.priority * 100) / 100;
  }

  copy(): JourneyAudit {
    return new JourneyAudit(
      this.code,
      this.name,
      this.priority,
      this.locale,
      this.archived,
      this.clicks,
      this.segment,
      this.retries,
      this.attributes,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a journey audit in status draft. */
export function newJourneyAudit(code: string, name: string): JourneyAudit {
  return new JourneyAudit(code, name, 0, "", false, 0, "", 0, new Map<string, string>(), "", "draft");
}
