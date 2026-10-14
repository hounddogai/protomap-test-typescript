import * as text from "../../../../kit/text.js";

/** Where a double opt in digest is in its life cycle. */
export type DoubleOptInDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a double opt in digest and its current status. */
export class DoubleOptInDigest {
  code: string;
  label: string;
  description: string;
  attributes: Map<string, string>;
  quantity: number;
  country: string;
  status: DoubleOptInDigestStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    attributes: Map<string, string>,
    quantity: number,
    country: string,
    status: DoubleOptInDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.attributes = attributes;
    this.quantity = quantity;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DoubleOptInDigestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): DoubleOptInDigest {
    return new DoubleOptInDigest(
      this.code,
      this.label,
      this.description,
      this.attributes,
      this.quantity,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a double opt in digest in status new. */
export function newDoubleOptInDigest(code: string, label: string): DoubleOptInDigest {
  return new DoubleOptInDigest(code, label, "", new Map<string, string>(), 0, "", "new");
}
