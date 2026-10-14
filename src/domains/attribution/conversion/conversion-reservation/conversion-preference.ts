import * as text from "../../../../kit/text.js";

/** Where a conversion preference is in its life cycle. */
export type ConversionPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A conversion preference as the conversion team keeps it. */
export class ConversionPreference {
  code: string;
  label: string;
  priority: number;
  externalRef: string;
  threshold: number;
  startsAt: number;
  currency: string;
  endsAt: number;
  createdAt: number;
  status: ConversionPreferenceStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    externalRef: string,
    threshold: number,
    startsAt: number,
    currency: string,
    endsAt: number,
    createdAt: number,
    status: ConversionPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.currency = currency;
    this.endsAt = endsAt;
    this.createdAt = createdAt;
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

  canMoveTo(next: ConversionPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "reopened";
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

  moveTo(next: ConversionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.priority - this.startsAt) * 100) / 100;
  }

  copy(): ConversionPreference {
    return new ConversionPreference(
      this.code,
      this.label,
      this.priority,
      this.externalRef,
      this.threshold,
      this.startsAt,
      this.currency,
      this.endsAt,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a conversion preference in status open. */
export function newConversionPreference(code: string, label: string): ConversionPreference {
  return new ConversionPreference(code, label, 0, "", 0, 0, "", 0, 0, "open");
}
