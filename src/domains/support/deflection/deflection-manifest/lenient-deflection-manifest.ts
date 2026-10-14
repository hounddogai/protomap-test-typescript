/**
 * The lenient deflection manifest records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient deflection manifest is in its life cycle. */
export type LenientDeflectionManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a lenient deflection manifest and its current status. */
export class LenientDeflectionManifest {
  code: string;
  name: string;
  priority: number;
  frequencyCap: number;
  sequence: number;
  margin: number;
  currency: string;
  label: string;
  maximum: number;
  variant: string;
  externalRef: string;
  status: LenientDeflectionManifestStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    frequencyCap: number,
    sequence: number,
    margin: number,
    currency: string,
    label: string,
    maximum: number,
    variant: string,
    externalRef: string,
    status: LenientDeflectionManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.frequencyCap = frequencyCap;
    this.sequence = sequence;
    this.margin = margin;
    this.currency = currency;
    this.label = label;
    this.maximum = maximum;
    this.variant = variant;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientDeflectionManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientDeflectionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient deflection manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.priority + this.sequence) * 100) / 100;
  }

  copy(): LenientDeflectionManifest {
    return new LenientDeflectionManifest(
      this.code,
      this.name,
      this.priority,
      this.frequencyCap,
      this.sequence,
      this.margin,
      this.currency,
      this.label,
      this.maximum,
      this.variant,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient deflection manifest in status proposed. */
export function newLenientDeflectionManifest(code: string, name: string): LenientDeflectionManifest {
  return new LenientDeflectionManifest(code, name, 0, 0, 0, 0, "", "", 0, "", "", "proposed");
}
