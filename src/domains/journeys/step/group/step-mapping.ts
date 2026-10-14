import * as text from "../../../../kit/text.js";

/** Where a step mapping is in its life cycle. */
export type StepMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A step mapping. Its code is unique within a tenant. */
export class StepMapping {
  code: string;
  label: string;
  revision: number;
  impressions: number;
  createdAt: number;
  variant: string;
  timezone: string;
  status: StepMappingStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    impressions: number,
    createdAt: number,
    variant: string,
    timezone: string,
    status: StepMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.impressions = impressions;
    this.createdAt = createdAt;
    this.variant = variant;
    this.timezone = timezone;
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

  canMoveTo(next: StepMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
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

  moveTo(next: StepMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.impressions * this.createdAt * 100) / 100;
  }

  copy(): StepMapping {
    return new StepMapping(
      this.code,
      this.label,
      this.revision,
      this.impressions,
      this.createdAt,
      this.variant,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a step mapping in status open. */
export function newStepMapping(code: string, label: string): StepMapping {
  return new StepMapping(code, label, 0, 0, 0, "", "", "open");
}
