import * as text from "../../../../kit/text.js";

/** Where a tiered retention forecast is in its life cycle. */
export type TieredRetentionForecastStatus = "created" | "validated" | "published" | "retired";

/** A tiered retention forecast. Its code is unique within a tenant. */
export class TieredRetentionForecast {
  code: string;
  title: string;
  sequence: number;
  revision: number;
  attempts: number;
  region: string;
  description: string;
  budget: number;
  summary: string;
  contactEmail: string;
  status: TieredRetentionForecastStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    revision: number,
    attempts: number,
    region: string,
    description: string,
    budget: number,
    summary: string,
    contactEmail: string,
    status: TieredRetentionForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.revision = revision;
    this.attempts = attempts;
    this.region = region;
    this.description = description;
    this.budget = budget;
    this.summary = summary;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: TieredRetentionForecastStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
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

  moveTo(next: TieredRetentionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered retention forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.attempts + this.sequence) * 100) / 100;
  }

  copy(): TieredRetentionForecast {
    return new TieredRetentionForecast(
      this.code,
      this.title,
      this.sequence,
      this.revision,
      this.attempts,
      this.region,
      this.description,
      this.budget,
      this.summary,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered retention forecast in status created. */
export function newTieredRetentionForecast(code: string, title: string): TieredRetentionForecast {
  return new TieredRetentionForecast(code, title, 0, 0, 0, "", "", 0, "", "", "created");
}
