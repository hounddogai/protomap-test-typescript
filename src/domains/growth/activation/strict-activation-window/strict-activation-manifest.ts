import * as text from "../../../../kit/text.js";

/** Where a strict activation manifest is in its life cycle. */
export type StrictActivationManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a strict activation manifest and its current status. */
export class StrictActivationManifest {
  code: string;
  label: string;
  description: string;
  attributes: Map<string, string>;
  attempts: number;
  visible: boolean;
  amount: number;
  threshold: number;
  active: boolean;
  phone: string;
  status: StrictActivationManifestStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    attributes: Map<string, string>,
    attempts: number,
    visible: boolean,
    amount: number,
    threshold: number,
    active: boolean,
    phone: string,
    status: StrictActivationManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.attributes = attributes;
    this.attempts = attempts;
    this.visible = visible;
    this.amount = amount;
    this.threshold = threshold;
    this.active = active;
    this.phone = phone;
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

  canMoveTo(next: StrictActivationManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
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
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StrictActivationManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict activation manifest ${this.code} cannot move from ${this.status} to ${next}`);
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

  adjustedExposure(): number {
    return Math.round(this.amount * this.threshold * 100) / 100;
  }

  copy(): StrictActivationManifest {
    return new StrictActivationManifest(
      this.code,
      this.label,
      this.description,
      this.attributes,
      this.attempts,
      this.visible,
      this.amount,
      this.threshold,
      this.active,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict activation manifest in status proposed. */
export function newStrictActivationManifest(code: string, label: string): StrictActivationManifest {
  return new StrictActivationManifest(
    code,
    label,
    "",
    new Map<string, string>(),
    0,
    false,
    0,
    0,
    false,
    "",
    "proposed",
  );
}
