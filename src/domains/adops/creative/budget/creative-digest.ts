import * as text from "../../../../kit/text.js";

/** Where a creative digest is in its life cycle. */
export type CreativeDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a creative digest and its current status. */
export class CreativeDigest {
  code: string;
  label: string;
  updatedAt: number;
  maximum: number;
  channel: string;
  unit: string;
  contactEmail: string;
  status: CreativeDigestStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    maximum: number,
    channel: string,
    unit: string,
    contactEmail: string,
    status: CreativeDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.maximum = maximum;
    this.channel = channel;
    this.unit = unit;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: CreativeDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "reopened";
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

  moveTo(next: CreativeDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedValue(): number {
    return Math.round((this.updatedAt + this.maximum) * 100) / 100;
  }

  copy(): CreativeDigest {
    return new CreativeDigest(
      this.code,
      this.label,
      this.updatedAt,
      this.maximum,
      this.channel,
      this.unit,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a creative digest in status open. */
export function newCreativeDigest(code: string, label: string): CreativeDigest {
  return new CreativeDigest(code, label, 0, 0, "", "", "", "open");
}
