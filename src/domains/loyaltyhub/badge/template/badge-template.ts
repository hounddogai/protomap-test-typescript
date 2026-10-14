/**
 * The badge template records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge template is in its life cycle. */
export type BadgeTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A badge template as the badge team keeps it. */
export class BadgeTemplate {
  code: string;
  name: string;
  limit: number;
  currency: string;
  attributes: Map<string, string>;
  utmSource: string;
  locale: string;
  clicks: number;
  status: BadgeTemplateStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    currency: string,
    attributes: Map<string, string>,
    utmSource: string,
    locale: string,
    clicks: number,
    status: BadgeTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.currency = currency;
    this.attributes = attributes;
    this.utmSource = utmSource;
    this.locale = locale;
    this.clicks = clicks;
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

  canMoveTo(next: BadgeTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round((this.limit + this.clicks) * 100) / 100;
  }

  copy(): BadgeTemplate {
    return new BadgeTemplate(
      this.code,
      this.name,
      this.limit,
      this.currency,
      this.attributes,
      this.utmSource,
      this.locale,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a badge template in status draft. */
export function newBadgeTemplate(code: string, name: string): BadgeTemplate {
  return new BadgeTemplate(code, name, 0, "", new Map<string, string>(), "", "", 0, "draft");
}
