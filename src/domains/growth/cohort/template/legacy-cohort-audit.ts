import * as text from "../../../../kit/text.js";

/** Where a legacy cohort audit is in its life cycle. */
export type LegacyCohortAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A legacy cohort audit. Its code is unique within a tenant. */
export class LegacyCohortAudit {
  code: string;
  name: string;
  currency: string;
  locale: string;
  utmSource: string;
  title: string;
  tags: string[];
  sequence: number;
  active: boolean;
  threshold: number;
  margin: number;
  status: LegacyCohortAuditStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    locale: string,
    utmSource: string,
    title: string,
    tags: string[],
    sequence: number,
    active: boolean,
    threshold: number,
    margin: number,
    status: LegacyCohortAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.locale = locale;
    this.utmSource = utmSource;
    this.title = title;
    this.tags = tags;
    this.sequence = sequence;
    this.active = active;
    this.threshold = threshold;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyCohortAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyCohortAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy cohort audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.threshold - this.sequence) * 100) / 100;
  }

  copy(): LegacyCohortAudit {
    return new LegacyCohortAudit(
      this.code,
      this.name,
      this.currency,
      this.locale,
      this.utmSource,
      this.title,
      this.tags,
      this.sequence,
      this.active,
      this.threshold,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy cohort audit in status planned. */
export function newLegacyCohortAudit(code: string, name: string): LegacyCohortAudit {
  return new LegacyCohortAudit(code, name, "", "", "", "", [], 0, false, 0, 0, "planned");
}
