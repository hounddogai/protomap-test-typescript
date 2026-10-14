import * as text from "../../../../kit/text.js";

/** Where a adaptive sla adjustment is in its life cycle. */
export type AdaptiveSlaAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a adaptive sla adjustment and its current status. */
export class AdaptiveSlaAdjustment {
  code: string;
  label: string;
  contactEmail: string;
  audienceId: string;
  cohort: string;
  checksum: string;
  attempts: number;
  version: number;
  visible: boolean;
  variant: string;
  status: AdaptiveSlaAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    audienceId: string,
    cohort: string,
    checksum: string,
    attempts: number,
    version: number,
    visible: boolean,
    variant: string,
    status: AdaptiveSlaAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.audienceId = audienceId;
    this.cohort = cohort;
    this.checksum = checksum;
    this.attempts = attempts;
    this.version = version;
    this.visible = visible;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveSlaAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveSlaAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive sla adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.attempts + this.version) * 100) / 100;
  }

  copy(): AdaptiveSlaAdjustment {
    return new AdaptiveSlaAdjustment(
      this.code,
      this.label,
      this.contactEmail,
      this.audienceId,
      this.cohort,
      this.checksum,
      this.attempts,
      this.version,
      this.visible,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive sla adjustment in status created. */
export function newAdaptiveSlaAdjustment(code: string, label: string): AdaptiveSlaAdjustment {
  return new AdaptiveSlaAdjustment(code, label, "", "", "", "", 0, 0, false, "", "created");
}
