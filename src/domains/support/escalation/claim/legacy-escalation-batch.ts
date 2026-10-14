import * as text from "../../../../kit/text.js";

/** Where a legacy escalation batch is in its life cycle. */
export type LegacyEscalationBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One legacy escalation batch, with what the planners need to act on it. */
export class LegacyEscalationBatch {
  code: string;
  name: string;
  segment: string;
  summary: string;
  active: boolean;
  ceiling: number;
  tags: string[];
  status: LegacyEscalationBatchStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    summary: string,
    active: boolean,
    ceiling: number,
    tags: string[],
    status: LegacyEscalationBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.summary = summary;
    this.active = active;
    this.ceiling = ceiling;
    this.tags = tags;
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

  canMoveTo(next: LegacyEscalationBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyEscalationBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy escalation batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): LegacyEscalationBatch {
    return new LegacyEscalationBatch(
      this.code,
      this.name,
      this.segment,
      this.summary,
      this.active,
      this.ceiling,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy escalation batch in status proposed. */
export function newLegacyEscalationBatch(code: string, name: string): LegacyEscalationBatch {
  return new LegacyEscalationBatch(code, name, "", "", false, 0, [], "proposed");
}
