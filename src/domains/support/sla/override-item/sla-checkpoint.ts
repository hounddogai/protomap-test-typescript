import * as text from "../../../../kit/text.js";

/** Where a sla checkpoint is in its life cycle. */
export type SlaCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A sla checkpoint as the sla team keeps it. */
export class SlaCheckpoint {
  code: string;
  label: string;
  budget: number;
  externalRef: string;
  threshold: number;
  unit: string;
  archived: boolean;
  name: string;
  channel: string;
  sendAt: number;
  status: SlaCheckpointStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    externalRef: string,
    threshold: number,
    unit: string,
    archived: boolean,
    name: string,
    channel: string,
    sendAt: number,
    status: SlaCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.unit = unit;
    this.archived = archived;
    this.name = name;
    this.channel = channel;
    this.sendAt = sendAt;
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

  canMoveTo(next: SlaCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SlaCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round((this.budget - this.sendAt) * 100) / 100;
  }

  copy(): SlaCheckpoint {
    return new SlaCheckpoint(
      this.code,
      this.label,
      this.budget,
      this.externalRef,
      this.threshold,
      this.unit,
      this.archived,
      this.name,
      this.channel,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a sla checkpoint in status created. */
export function newSlaCheckpoint(code: string, label: string): SlaCheckpoint {
  return new SlaCheckpoint(code, label, 0, "", 0, "", false, "", "", 0, "created");
}
