import * as text from "../../../../kit/text.js";

/** Where a proof template is in its life cycle. */
export type ProofTemplateStatus = "created" | "validated" | "published" | "retired";

/** A proof template as the proof team keeps it. */
export class ProofTemplate {
  code: string;
  title: string;
  rate: number;
  journeyId: string;
  budget: number;
  sequence: number;
  durationMinutes: number;
  revision: number;
  status: ProofTemplateStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    journeyId: string,
    budget: number,
    sequence: number,
    durationMinutes: number,
    revision: number,
    status: ProofTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.journeyId = journeyId;
    this.budget = budget;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.revision = revision;
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

  canMoveTo(next: ProofTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"proof template"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.budget - this.sequence) * 100) / 100;
  }

  copy(): ProofTemplate {
    return new ProofTemplate(
      this.code,
      this.title,
      this.rate,
      this.journeyId,
      this.budget,
      this.sequence,
      this.durationMinutes,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a proof template in status created. */
export function newProofTemplate(code: string, title: string): ProofTemplate {
  return new ProofTemplate(code, title, 0, "", 0, 0, 0, 0, "created");
}
