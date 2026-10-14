import * as text from "../../../../kit/text.js";

/** Where a regional frequency draft is in its life cycle. */
export type RegionalFrequencyDraftStatus = "created" | "validated" | "published" | "retired";

/** A regional frequency draft. Its code is unique within a tenant. */
export class RegionalFrequencyDraft {
  code: string;
  name: string;
  source: string;
  updatedAt: number;
  weight: number;
  audienceId: string;
  tags: string[];
  conversionRate: number;
  budget: number;
  status: RegionalFrequencyDraftStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    updatedAt: number,
    weight: number,
    audienceId: string,
    tags: string[],
    conversionRate: number,
    budget: number,
    status: RegionalFrequencyDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.updatedAt = updatedAt;
    this.weight = weight;
    this.audienceId = audienceId;
    this.tags = tags;
    this.conversionRate = conversionRate;
    this.budget = budget;
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

  canMoveTo(next: RegionalFrequencyDraftStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RegionalFrequencyDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional frequency draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional frequency draft"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round(this.updatedAt * this.conversionRate * 100) / 100;
  }

  copy(): RegionalFrequencyDraft {
    return new RegionalFrequencyDraft(
      this.code,
      this.name,
      this.source,
      this.updatedAt,
      this.weight,
      this.audienceId,
      this.tags,
      this.conversionRate,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional frequency draft in status created. */
export function newRegionalFrequencyDraft(code: string, name: string): RegionalFrequencyDraft {
  return new RegionalFrequencyDraft(code, name, "", 0, 0, "", [], 0, 0, "created");
}
