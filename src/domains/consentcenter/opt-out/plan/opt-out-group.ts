import * as text from "../../../../kit/text.js";

/** Where a opt out group is in its life cycle. */
export type OptOutGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One opt out group, with what the planners need to act on it. */
export class OptOutGroup {
  code: string;
  title: string;
  maximum: number;
  label: string;
  active: boolean;
  budget: number;
  locale: string;
  utmSource: string;
  summary: string;
  expiresAt: number;
  status: OptOutGroupStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    label: string,
    active: boolean,
    budget: number,
    locale: string,
    utmSource: string,
    summary: string,
    expiresAt: number,
    status: OptOutGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.label = label;
    this.active = active;
    this.budget = budget;
    this.locale = locale;
    this.utmSource = utmSource;
    this.summary = summary;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: OptOutGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: OptOutGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"opt out group"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.expiresAt * this.budget * 100) / 100;
  }

  copy(): OptOutGroup {
    return new OptOutGroup(
      this.code,
      this.title,
      this.maximum,
      this.label,
      this.active,
      this.budget,
      this.locale,
      this.utmSource,
      this.summary,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a opt out group in status draft. */
export function newOptOutGroup(code: string, title: string): OptOutGroup {
  return new OptOutGroup(code, title, 0, "", false, 0, "", "", "", 0, "draft");
}
