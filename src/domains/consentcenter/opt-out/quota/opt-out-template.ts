import * as text from "../../../../kit/text.js";

/** Where a opt out template is in its life cycle. */
export type OptOutTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A opt out template as the opt out team keeps it. */
export class OptOutTemplate {
  code: string;
  title: string;
  createdAt: number;
  rate: number;
  segment: string;
  expiresAt: number;
  attempts: number;
  timezone: string;
  contactEmail: string;
  archived: boolean;
  status: OptOutTemplateStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    rate: number,
    segment: string,
    expiresAt: number,
    attempts: number,
    timezone: string,
    contactEmail: string,
    archived: boolean,
    status: OptOutTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.rate = rate;
    this.segment = segment;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.timezone = timezone;
    this.contactEmail = contactEmail;
    this.archived = archived;
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

  canMoveTo(next: OptOutTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
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

  moveTo(next: OptOutTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round((this.createdAt + this.expiresAt) * 100) / 100;
  }

  copy(): OptOutTemplate {
    return new OptOutTemplate(
      this.code,
      this.title,
      this.createdAt,
      this.rate,
      this.segment,
      this.expiresAt,
      this.attempts,
      this.timezone,
      this.contactEmail,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a opt out template in status draft. */
export function newOptOutTemplate(code: string, title: string): OptOutTemplate {
  return new OptOutTemplate(code, title, 0, 0, "", 0, 0, "", "", false, "draft");
}
