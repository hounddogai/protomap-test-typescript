import * as text from "../../../../kit/text.js";

/** Where a default domain template is in its life cycle. */
export type DefaultDomainTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One default domain template, with what the planners need to act on it. */
export class DefaultDomainTemplate {
  code: string;
  name: string;
  approved: boolean;
  utmSource: string;
  attributes: Map<string, string>;
  startsAt: number;
  summary: string;
  status: DefaultDomainTemplateStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    utmSource: string,
    attributes: Map<string, string>,
    startsAt: number,
    summary: string,
    status: DefaultDomainTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.utmSource = utmSource;
    this.attributes = attributes;
    this.startsAt = startsAt;
    this.summary = summary;
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

  canMoveTo(next: DefaultDomainTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultDomainTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default domain template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): DefaultDomainTemplate {
    return new DefaultDomainTemplate(
      this.code,
      this.name,
      this.approved,
      this.utmSource,
      this.attributes,
      this.startsAt,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a default domain template in status open. */
export function newDefaultDomainTemplate(code: string, name: string): DefaultDomainTemplate {
  return new DefaultDomainTemplate(code, name, false, "", new Map<string, string>(), 0, "", "open");
}
