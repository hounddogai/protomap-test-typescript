import * as text from "../../../../kit/text.js";

/** Where a suppression audit is in its life cycle. */
export type SuppressionAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A suppression audit as the suppression team keeps it. */
export class SuppressionAudit {
  code: string;
  label: string;
  limit: number;
  maximum: number;
  updatedAt: number;
  status: SuppressionAuditStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    maximum: number,
    updatedAt: number,
    status: SuppressionAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.maximum = maximum;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: SuppressionAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: SuppressionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"suppression audit"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.maximum - this.updatedAt) * 100) / 100;
  }

  copy(): SuppressionAudit {
    return new SuppressionAudit(this.code, this.label, this.limit, this.maximum, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a suppression audit in status planned. */
export function newSuppressionAudit(code: string, label: string): SuppressionAudit {
  return new SuppressionAudit(code, label, 0, 0, 0, "planned");
}
