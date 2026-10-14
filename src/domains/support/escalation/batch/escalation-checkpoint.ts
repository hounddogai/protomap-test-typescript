import * as text from "../../../../kit/text.js";

/** Where a escalation checkpoint is in its life cycle. */
export type EscalationCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A escalation checkpoint. Its code is unique within a tenant. */
export class EscalationCheckpoint {
  code: string;
  label: string;
  archived: boolean;
  revision: number;
  maximum: number;
  clicks: number;
  quantity: number;
  contactEmail: string;
  status: EscalationCheckpointStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    revision: number,
    maximum: number,
    clicks: number,
    quantity: number,
    contactEmail: string,
    status: EscalationCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.revision = revision;
    this.maximum = maximum;
    this.clicks = clicks;
    this.quantity = quantity;
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

  canMoveTo(next: EscalationCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
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

  moveTo(next: EscalationCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"escalation checkpoint"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.revision * this.quantity * 100) / 100;
  }

  copy(): EscalationCheckpoint {
    return new EscalationCheckpoint(
      this.code,
      this.label,
      this.archived,
      this.revision,
      this.maximum,
      this.clicks,
      this.quantity,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a escalation checkpoint in status planned. */
export function newEscalationCheckpoint(code: string, label: string): EscalationCheckpoint {
  return new EscalationCheckpoint(code, label, false, 0, 0, 0, 0, "", "planned");
}
