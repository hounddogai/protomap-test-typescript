import * as text from "../../../../kit/text.js";

/** Where a domain template is in its life cycle. */
export type DomainTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One domain template, with what the planners need to act on it. */
export class DomainTemplate {
  code: string;
  label: string;
  utmSource: string;
  description: string;
  clicks: number;
  locale: string;
  source: string;
  expiresAt: number;
  summary: string;
  openRate: number;
  status: DomainTemplateStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    description: string,
    clicks: number,
    locale: string,
    source: string,
    expiresAt: number,
    summary: string,
    openRate: number,
    status: DomainTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.description = description;
    this.clicks = clicks;
    this.locale = locale;
    this.source = source;
    this.expiresAt = expiresAt;
    this.summary = summary;
    this.openRate = openRate;
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

  canMoveTo(next: DomainTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"domain template"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.clicks * this.expiresAt * 100) / 100;
  }

  copy(): DomainTemplate {
    return new DomainTemplate(
      this.code,
      this.label,
      this.utmSource,
      this.description,
      this.clicks,
      this.locale,
      this.source,
      this.expiresAt,
      this.summary,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a domain template in status open. */
export function newDomainTemplate(code: string, label: string): DomainTemplate {
  return new DomainTemplate(code, label, "", "", 0, "", "", 0, "", 0, "open");
}
