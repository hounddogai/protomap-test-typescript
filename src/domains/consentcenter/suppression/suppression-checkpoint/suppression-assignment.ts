import * as text from "../../../../kit/text.js";

/** Where a suppression assignment is in its life cycle. */
export type SuppressionAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A suppression assignment. Its code is unique within a tenant. */
export class SuppressionAssignment {
  code: string;
  label: string;
  updatedAt: number;
  locale: string;
  frequencyCap: number;
  clicks: number;
  weight: number;
  reviewer: string;
  visible: boolean;
  status: SuppressionAssignmentStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    locale: string,
    frequencyCap: number,
    clicks: number,
    weight: number,
    reviewer: string,
    visible: boolean,
    status: SuppressionAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.clicks = clicks;
    this.weight = weight;
    this.reviewer = reviewer;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.weight - this.frequencyCap) * 100) / 100;
  }

  copy(): SuppressionAssignment {
    return new SuppressionAssignment(
      this.code,
      this.label,
      this.updatedAt,
      this.locale,
      this.frequencyCap,
      this.clicks,
      this.weight,
      this.reviewer,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a suppression assignment in status requested. */
export function newSuppressionAssignment(code: string, label: string): SuppressionAssignment {
  return new SuppressionAssignment(code, label, 0, "", 0, 0, 0, "", false, "requested");
}
