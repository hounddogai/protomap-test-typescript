import * as text from "../../../../kit/text.js";

/** Where a scheduled touchpoint audit is in its life cycle. */
export type ScheduledTouchpointAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled touchpoint audit, with what the planners need to act on it. */
export class ScheduledTouchpointAudit {
  code: string;
  label: string;
  locale: string;
  journeyId: string;
  region: string;
  source: string;
  description: string;
  version: number;
  attempts: number;
  budget: number;
  attributes: Map<string, string>;
  status: ScheduledTouchpointAuditStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    journeyId: string,
    region: string,
    source: string,
    description: string,
    version: number,
    attempts: number,
    budget: number,
    attributes: Map<string, string>,
    status: ScheduledTouchpointAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.journeyId = journeyId;
    this.region = region;
    this.source = source;
    this.description = description;
    this.version = version;
    this.attempts = attempts;
    this.budget = budget;
    this.attributes = attributes;
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

  canMoveTo(next: ScheduledTouchpointAuditStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: ScheduledTouchpointAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled touchpoint audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"scheduled touchpoint audit"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.version - this.budget) * 100) / 100;
  }

  copy(): ScheduledTouchpointAudit {
    return new ScheduledTouchpointAudit(
      this.code,
      this.label,
      this.locale,
      this.journeyId,
      this.region,
      this.source,
      this.description,
      this.version,
      this.attempts,
      this.budget,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled touchpoint audit in status open. */
export function newScheduledTouchpointAudit(code: string, label: string): ScheduledTouchpointAudit {
  return new ScheduledTouchpointAudit(code, label, "", "", "", "", "", 0, 0, 0, new Map<string, string>(), "open");
}
