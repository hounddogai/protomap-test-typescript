import * as text from "../../../../kit/text.js";

/** Where a insight target is in its life cycle. */
export type InsightTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One insight target, with what the planners need to act on it. */
export class InsightTarget {
  code: string;
  name: string;
  contactEmail: string;
  segment: string;
  audienceId: string;
  region: string;
  country: string;
  unit: string;
  channel: string;
  maximum: number;
  archived: boolean;
  status: InsightTargetStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    segment: string,
    audienceId: string,
    region: string,
    country: string,
    unit: string,
    channel: string,
    maximum: number,
    archived: boolean,
    status: InsightTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.segment = segment;
    this.audienceId = audienceId;
    this.region = region;
    this.country = country;
    this.unit = unit;
    this.channel = channel;
    this.maximum = maximum;
    this.archived = archived;
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

  canMoveTo(next: InsightTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): InsightTarget {
    return new InsightTarget(
      this.code,
      this.name,
      this.contactEmail,
      this.segment,
      this.audienceId,
      this.region,
      this.country,
      this.unit,
      this.channel,
      this.maximum,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a insight target in status proposed. */
export function newInsightTarget(code: string, name: string): InsightTarget {
  return new InsightTarget(code, name, "", "", "", "", "", "", "", 0, false, "proposed");
}
