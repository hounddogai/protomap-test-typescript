import * as text from "../../../../kit/text.js";

/** Where a default escalation manifest is in its life cycle. */
export type DefaultEscalationManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default escalation manifest. Its code is unique within a tenant. */
export class DefaultEscalationManifest {
  code: string;
  label: string;
  locale: string;
  utmSource: string;
  capacity: number;
  campaignRef: string;
  threshold: number;
  status: DefaultEscalationManifestStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    utmSource: string,
    capacity: number,
    campaignRef: string,
    threshold: number,
    status: DefaultEscalationManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.utmSource = utmSource;
    this.capacity = capacity;
    this.campaignRef = campaignRef;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultEscalationManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultEscalationManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default escalation manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round(this.capacity * this.threshold * 100) / 100;
  }

  copy(): DefaultEscalationManifest {
    return new DefaultEscalationManifest(
      this.code,
      this.label,
      this.locale,
      this.utmSource,
      this.capacity,
      this.campaignRef,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default escalation manifest in status planned. */
export function newDefaultEscalationManifest(code: string, label: string): DefaultEscalationManifest {
  return new DefaultEscalationManifest(code, label, "", "", 0, "", 0, "planned");
}
