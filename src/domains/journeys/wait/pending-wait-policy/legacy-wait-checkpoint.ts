import * as text from "../../../../kit/text.js";

/** Where a legacy wait checkpoint is in its life cycle. */
export type LegacyWaitCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A legacy wait checkpoint as the wait team keeps it. */
export class LegacyWaitCheckpoint {
  code: string;
  title: string;
  locale: string;
  label: string;
  rate: number;
  cost: number;
  budget: number;
  variant: string;
  region: string;
  visible: boolean;
  contactEmail: string;
  status: LegacyWaitCheckpointStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    label: string,
    rate: number,
    cost: number,
    budget: number,
    variant: string,
    region: string,
    visible: boolean,
    contactEmail: string,
    status: LegacyWaitCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.label = label;
    this.rate = rate;
    this.cost = cost;
    this.budget = budget;
    this.variant = variant;
    this.region = region;
    this.visible = visible;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: LegacyWaitCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyWaitCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy wait checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round((this.cost - this.rate) * 100) / 100;
  }

  copy(): LegacyWaitCheckpoint {
    return new LegacyWaitCheckpoint(
      this.code,
      this.title,
      this.locale,
      this.label,
      this.rate,
      this.cost,
      this.budget,
      this.variant,
      this.region,
      this.visible,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy wait checkpoint in status planned. */
export function newLegacyWaitCheckpoint(code: string, title: string): LegacyWaitCheckpoint {
  return new LegacyWaitCheckpoint(code, title, "", "", 0, 0, 0, "", "", false, "", "planned");
}
