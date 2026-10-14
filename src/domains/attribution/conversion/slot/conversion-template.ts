import * as text from "../../../../kit/text.js";

/** Where a conversion template is in its life cycle. */
export type ConversionTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** One conversion template, with what the planners need to act on it. */
export class ConversionTemplate {
  code: string;
  name: string;
  journeyId: string;
  budget: number;
  attributes: Map<string, string>;
  rate: number;
  timezone: string;
  status: ConversionTemplateStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    budget: number,
    attributes: Map<string, string>,
    rate: number,
    timezone: string,
    status: ConversionTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.budget = budget;
    this.attributes = attributes;
    this.rate = rate;
    this.timezone = timezone;
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

  canMoveTo(next: ConversionTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ConversionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion template ${this.code} cannot move from ${this.status} to ${next}`);
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

  projectedLoad(): number {
    return Math.round((this.budget + this.rate) * 100) / 100;
  }

  copy(): ConversionTemplate {
    return new ConversionTemplate(
      this.code,
      this.name,
      this.journeyId,
      this.budget,
      this.attributes,
      this.rate,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a conversion template in status requested. */
export function newConversionTemplate(code: string, name: string): ConversionTemplate {
  return new ConversionTemplate(code, name, "", 0, new Map<string, string>(), 0, "", "requested");
}
