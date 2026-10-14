import * as text from "../../../../kit/text.js";

/** Where a default journey proposal is in its life cycle. */
export type DefaultJourneyProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a default journey proposal and its current status. */
export class DefaultJourneyProposal {
  code: string;
  label: string;
  version: number;
  segment: string;
  durationMinutes: number;
  description: string;
  cost: number;
  visible: boolean;
  weight: number;
  status: DefaultJourneyProposalStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    segment: string,
    durationMinutes: number,
    description: string,
    cost: number,
    visible: boolean,
    weight: number,
    status: DefaultJourneyProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.segment = segment;
    this.durationMinutes = durationMinutes;
    this.description = description;
    this.cost = cost;
    this.visible = visible;
    this.weight = weight;
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

  canMoveTo(next: DefaultJourneyProposalStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultJourneyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default journey proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round((this.weight - this.cost) * 100) / 100;
  }

  copy(): DefaultJourneyProposal {
    return new DefaultJourneyProposal(
      this.code,
      this.label,
      this.version,
      this.segment,
      this.durationMinutes,
      this.description,
      this.cost,
      this.visible,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a default journey proposal in status open. */
export function newDefaultJourneyProposal(code: string, label: string): DefaultJourneyProposal {
  return new DefaultJourneyProposal(code, label, 0, "", 0, "", 0, false, 0, "open");
}
