import * as text from "../../../../kit/text.js";

/** Where a rolling domain manifest is in its life cycle. */
export type RollingDomainManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling domain manifest, with what the planners need to act on it. */
export class RollingDomainManifest {
  code: string;
  label: string;
  variant: string;
  frequencyCap: number;
  unit: string;
  windowDays: number;
  ownerId: string;
  contactEmail: string;
  margin: number;
  currency: string;
  timezone: string;
  status: RollingDomainManifestStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    frequencyCap: number,
    unit: string,
    windowDays: number,
    ownerId: string,
    contactEmail: string,
    margin: number,
    currency: string,
    timezone: string,
    status: RollingDomainManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.frequencyCap = frequencyCap;
    this.unit = unit;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.contactEmail = contactEmail;
    this.margin = margin;
    this.currency = currency;
    this.timezone = timezone;
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

  canMoveTo(next: RollingDomainManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingDomainManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling domain manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedExposure(): number {
    return Math.round((this.frequencyCap - this.windowDays) * 100) / 100;
  }

  copy(): RollingDomainManifest {
    return new RollingDomainManifest(
      this.code,
      this.label,
      this.variant,
      this.frequencyCap,
      this.unit,
      this.windowDays,
      this.ownerId,
      this.contactEmail,
      this.margin,
      this.currency,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling domain manifest in status planned. */
export function newRollingDomainManifest(code: string, label: string): RollingDomainManifest {
  return new RollingDomainManifest(code, label, "", 0, "", 0, "", "", 0, "", "", "planned");
}
