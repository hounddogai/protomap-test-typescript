import * as text from "../../../../kit/text.js";

/** Where a weighted conversion audit is in its life cycle. */
export type WeightedConversionAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One weighted conversion audit, with what the planners need to act on it. */
export class WeightedConversionAudit {
  code: string;
  name: string;
  priority: number;
  attempts: number;
  unit: string;
  timezone: string;
  status: WeightedConversionAuditStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    attempts: number,
    unit: string,
    timezone: string,
    status: WeightedConversionAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.attempts = attempts;
    this.unit = unit;
    this.timezone = timezone;
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

  canMoveTo(next: WeightedConversionAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
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

  moveTo(next: WeightedConversionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted conversion audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.attempts - this.priority) * 100) / 100;
  }

  copy(): WeightedConversionAudit {
    return new WeightedConversionAudit(
      this.code,
      this.name,
      this.priority,
      this.attempts,
      this.unit,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a weighted conversion audit in status proposed. */
export function newWeightedConversionAudit(code: string, name: string): WeightedConversionAudit {
  return new WeightedConversionAudit(code, name, 0, 0, "", "", "proposed");
}
