import * as text from "../../../../kit/text.js";

/** Where a sla preference is in its life cycle. */
export type SlaPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A sla preference. Its code is unique within a tenant. */
export class SlaPreference {
  code: string;
  label: string;
  impressions: number;
  country: string;
  endsAt: number;
  status: SlaPreferenceStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    country: string,
    endsAt: number,
    status: SlaPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.country = country;
    this.endsAt = endsAt;
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

  canMoveTo(next: SlaPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
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

  moveTo(next: SlaPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round((this.endsAt - this.impressions) * 100) / 100;
  }

  copy(): SlaPreference {
    return new SlaPreference(this.code, this.label, this.impressions, this.country, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a sla preference in status open. */
export function newSlaPreference(code: string, label: string): SlaPreference {
  return new SlaPreference(code, label, 0, "", 0, "open");
}
