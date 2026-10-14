import * as text from "../../../../kit/text.js";

/** Where a escalation rollup is in its life cycle. */
export type EscalationRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A escalation rollup. Its code is unique within a tenant. */
export class EscalationRollup {
  code: string;
  name: string;
  openRate: number;
  visible: boolean;
  summary: string;
  contactEmail: string;
  durationMinutes: number;
  description: string;
  clicks: number;
  cohort: string;
  status: EscalationRollupStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    visible: boolean,
    summary: string,
    contactEmail: string,
    durationMinutes: number,
    description: string,
    clicks: number,
    cohort: string,
    status: EscalationRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.visible = visible;
    this.summary = summary;
    this.contactEmail = contactEmail;
    this.durationMinutes = durationMinutes;
    this.description = description;
    this.clicks = clicks;
    this.cohort = cohort;
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

  canMoveTo(next: EscalationRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"escalation rollup"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.clicks + this.openRate) * 100) / 100;
  }

  copy(): EscalationRollup {
    return new EscalationRollup(
      this.code,
      this.name,
      this.openRate,
      this.visible,
      this.summary,
      this.contactEmail,
      this.durationMinutes,
      this.description,
      this.clicks,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a escalation rollup in status planned. */
export function newEscalationRollup(code: string, name: string): EscalationRollup {
  return new EscalationRollup(code, name, 0, false, "", "", 0, "", 0, "", "planned");
}
