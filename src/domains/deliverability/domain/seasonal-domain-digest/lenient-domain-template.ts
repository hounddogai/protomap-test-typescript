import * as text from "../../../../kit/text.js";

/** Where a lenient domain template is in its life cycle. */
export type LenientDomainTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** One lenient domain template, with what the planners need to act on it. */
export class LenientDomainTemplate {
  code: string;
  label: string;
  discount: number;
  utmSource: string;
  title: string;
  openRate: number;
  timezone: string;
  externalRef: string;
  sequence: number;
  attributes: Map<string, string>;
  status: LenientDomainTemplateStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    utmSource: string,
    title: string,
    openRate: number,
    timezone: string,
    externalRef: string,
    sequence: number,
    attributes: Map<string, string>,
    status: LenientDomainTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.utmSource = utmSource;
    this.title = title;
    this.openRate = openRate;
    this.timezone = timezone;
    this.externalRef = externalRef;
    this.sequence = sequence;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientDomainTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientDomainTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient domain template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round((this.openRate - this.sequence) * 100) / 100;
  }

  copy(): LenientDomainTemplate {
    return new LenientDomainTemplate(
      this.code,
      this.label,
      this.discount,
      this.utmSource,
      this.title,
      this.openRate,
      this.timezone,
      this.externalRef,
      this.sequence,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient domain template in status requested. */
export function newLenientDomainTemplate(code: string, label: string): LenientDomainTemplate {
  return new LenientDomainTemplate(code, label, 0, "", "", 0, "", "", 0, new Map<string, string>(), "requested");
}
