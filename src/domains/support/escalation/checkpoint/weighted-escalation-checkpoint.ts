/**
 * The weighted escalation checkpoint records of support's escalation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted escalation checkpoint is in its life cycle. */
export type WeightedEscalationCheckpointStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted escalation checkpoint as the escalation team keeps it. */
export class WeightedEscalationCheckpoint {
  code: string;
  name: string;
  locale: string;
  checksum: string;
  channel: string;
  label: string;
  description: string;
  variant: string;
  score: number;
  status: WeightedEscalationCheckpointStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    checksum: string,
    channel: string,
    label: string,
    description: string,
    variant: string,
    score: number,
    status: WeightedEscalationCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.checksum = checksum;
    this.channel = channel;
    this.label = label;
    this.description = description;
    this.variant = variant;
    this.score = score;
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

  canMoveTo(next: WeightedEscalationCheckpointStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedEscalationCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted escalation checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): WeightedEscalationCheckpoint {
    return new WeightedEscalationCheckpoint(
      this.code,
      this.name,
      this.locale,
      this.checksum,
      this.channel,
      this.label,
      this.description,
      this.variant,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted escalation checkpoint in status proposed. */
export function newWeightedEscalationCheckpoint(code: string, name: string): WeightedEscalationCheckpoint {
  return new WeightedEscalationCheckpoint(code, name, "", "", "", "", "", "", 0, "proposed");
}
