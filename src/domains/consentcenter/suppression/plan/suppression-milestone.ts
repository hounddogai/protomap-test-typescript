import * as text from "../../../../kit/text.js";

/** Where a suppression milestone is in its life cycle. */
export type SuppressionMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A suppression milestone as the suppression team keeps it. */
export class SuppressionMilestone {
  code: string;
  label: string;
  sendAt: number;
  variant: string;
  archived: boolean;
  utmSource: string;
  retries: number;
  status: SuppressionMilestoneStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    variant: string,
    archived: boolean,
    utmSource: string,
    retries: number,
    status: SuppressionMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.variant = variant;
    this.archived = archived;
    this.utmSource = utmSource;
    this.retries = retries;
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

  canMoveTo(next: SuppressionMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SuppressionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveValue(): number {
    return Math.round(this.retries * this.sendAt * 100) / 100;
  }

  copy(): SuppressionMilestone {
    return new SuppressionMilestone(
      this.code,
      this.label,
      this.sendAt,
      this.variant,
      this.archived,
      this.utmSource,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a suppression milestone in status planned. */
export function newSuppressionMilestone(code: string, label: string): SuppressionMilestone {
  return new SuppressionMilestone(code, label, 0, "", false, "", 0, "planned");
}
