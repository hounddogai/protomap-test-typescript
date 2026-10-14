import * as text from "../../../../kit/text.js";

/** Where a conversion agreement is in its life cycle. */
export type ConversionAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One conversion agreement, with what the planners need to act on it. */
export class ConversionAgreement {
  code: string;
  name: string;
  cohort: string;
  region: string;
  campaignRef: string;
  revision: number;
  attributes: Map<string, string>;
  utmSource: string;
  status: ConversionAgreementStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    region: string,
    campaignRef: string,
    revision: number,
    attributes: Map<string, string>,
    utmSource: string,
    status: ConversionAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.region = region;
    this.campaignRef = campaignRef;
    this.revision = revision;
    this.attributes = attributes;
    this.utmSource = utmSource;
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

  canMoveTo(next: ConversionAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
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

  measuredValue(): number {
    return this.revision;
  }

  copy(): ConversionAgreement {
    return new ConversionAgreement(
      this.code,
      this.name,
      this.cohort,
      this.region,
      this.campaignRef,
      this.revision,
      this.attributes,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a conversion agreement in status open. */
export function newConversionAgreement(code: string, name: string): ConversionAgreement {
  return new ConversionAgreement(code, name, "", "", "", 0, new Map<string, string>(), "", "open");
}
