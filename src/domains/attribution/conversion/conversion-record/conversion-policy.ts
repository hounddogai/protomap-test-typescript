import * as text from "../../../../kit/text.js";

/** Where a conversion policy is in its life cycle. */
export type ConversionPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A conversion policy. Its code is unique within a tenant. */
export class ConversionPolicy {
  code: string;
  name: string;
  country: string;
  notes: string;
  weight: number;
  utmSource: string;
  status: ConversionPolicyStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    notes: string,
    weight: number,
    utmSource: string,
    status: ConversionPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.notes = notes;
    this.weight = weight;
    this.utmSource = utmSource;
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

  canMoveTo(next: ConversionPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ConversionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): ConversionPolicy {
    return new ConversionPolicy(
      this.code,
      this.name,
      this.country,
      this.notes,
      this.weight,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a conversion policy in status requested. */
export function newConversionPolicy(code: string, name: string): ConversionPolicy {
  return new ConversionPolicy(code, name, "", "", 0, "", "requested");
}
